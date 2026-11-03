use std::path::PathBuf;
use std::process::Child;

use tauri::Manager;

mod collaboration;
mod updater;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Spawn the bundled C# engine sidecar (serves localhost:5180).
            // Packaged: <resources>/engine/Poolr.Engine.Api.exe (self-contained, no .NET needed)
            // Dev:      engine/Poolr.Engine.Api/bin/Release/net8.0/Poolr.Engine.Api.exe
            spawn_engine_sidecar(app.handle());

            // Frontend → Rust dialogs (Open/Save project).
            let _ = app.handle().plugin(tauri_plugin_dialog::init());

            // Updater plugin (checks GitHub releases)
            let _ = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build());

            Ok(())
        })
        .manage(updater::UpdaterState::default())
        .invoke_handler(tauri::generate_handler![
            updater::check_for_updates,
            collaboration::collaboration_command,
            open_browser
        ])
        // Graceful close: window close / quit / Ctrl+C.
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                kill_engine(app);
            }
        });
}

#[tauri::command]
fn open_browser(url: String) -> Result<(), String> {
    let parsed = tauri::Url::parse(&url).map_err(|_| "Invalid URL")?;
    if !matches!(parsed.scheme(), "http" | "https") || parsed.host_str().is_none() {
        return Err("Only web links can be opened".into());
    }
    #[cfg(windows)]
    {
        std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", parsed.as_str()])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

struct EngineSidecar(std::sync::Mutex<Option<Child>>);

fn kill_engine(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<EngineSidecar>() {
        if let Ok(mut guard) = state.0.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
            }
        }
    }
}

// Spawns the C# engine sidecar as a plain child process and stores its handle so
// it can be killed on app exit. The child is placed in a Windows JobObject with
// KillOnJobClose, so it is reaped even if the app crashes or is SIGKILLed.
// In packaged builds the exe lives in <resources>/engine/; in `tauri dev` it
// lives in the engine project's Release build output. At least one must exist.
fn spawn_engine_sidecar(app: &tauri::AppHandle) {
    let mut candidates: Vec<PathBuf> = Vec::new();
    let exe_name = if cfg!(windows) {
        "Poolr.Engine.Api.exe"
    } else {
        "Poolr.Engine.Api"
    };

    // Packaged layout: resourcesDir/engine/<exe_name>
    if let Ok(res) = app.path().resource_dir() {
        candidates.push(res.join("engine").join(exe_name));
    }

    // Dev layout: <repo>/engine/Poolr.Engine.Api/bin/Release/net8.0/<exe_name>
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(
            cwd.join("engine")
                .join("Poolr.Engine.Api")
                .join("bin")
                .join("Release")
                .join("net8.0")
                .join(exe_name),
        );
        candidates.push(
            cwd.join("..")
                .join("engine")
                .join("Poolr.Engine.Api")
                .join("bin")
                .join("Release")
                .join("net8.0")
                .join(exe_name),
        );
    }

    let exe = match candidates.into_iter().find(|p| p.exists()) {
        Some(p) => p,
        None => {
            log::warn!("engine sidecar not found; poolr will run with no C# engine");
            return;
        }
    };

    // v0.5.2 — build the command once; Windows-only hardening (no console
    // window, no stdio pipes) is applied to `cmd` below.
    //
    // The engine exe is a console-subsystem executable: spawned plainly from
    // this GUI app it made Windows allocate (and flash) a black console window
    // on every launch. CREATE_NO_WINDOW suppresses it, and stdio is explicitly
    // nulled: piping stdout without draining it would stall the engine once its
    // log buffer filled, and inheriting our (windowless) console would
    // recreate the bug.
    let mut cmd = std::process::Command::new(&exe);
    app.manage(collaboration::CollaborationRuntime {
        executable: exe.clone(),
        gate: std::sync::Arc::new(std::sync::Mutex::new(())),
    });

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        cmd.stdin(std::process::Stdio::null());
        cmd.stdout(std::process::Stdio::null());
        cmd.stderr(std::process::Stdio::null());
    }

    match cmd.spawn() {
        Ok(child) => {
            // Attach to a KillOnJobClose job so a crash/force-kill can't orphan it.
            job_object::assign(child.id());
            app.manage(EngineSidecar(std::sync::Mutex::new(Some(child))));
        }
        Err(e) => log::error!("failed to spawn engine sidecar {exe:?}: {e}"),
    }
}

// Minimal Windows JobObject wrapper: a single job that closes (killing members)
// when the last handle to it is released — i.e. when this process exits.
#[cfg(windows)]
mod job_object {
    use std::sync::OnceLock;
    use winapi::shared::minwindef::DWORD;
    use winapi::um::handleapi::CloseHandle;
    use winapi::um::jobapi2::{
        AssignProcessToJobObject, CreateJobObjectW, SetInformationJobObject,
    };
    use winapi::um::processthreadsapi::OpenProcess;
    use winapi::um::winnt::{
        JobObjectExtendedLimitInformation, HANDLE, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };

    // One job per app process; leak the handle intentionally — closing it would
    // kill the sidecar prematurely. The OS reaps the job (and child) on our exit.
    // HANDLE is a raw pointer (not Send/Sync), so store it as usize behind a
    // OnceLock: initialised exactly once, read-only afterwards — no `static mut`.
    static JOB: OnceLock<usize> = OnceLock::new();

    pub fn assign(pid: u32) {
        let job = *JOB.get_or_init(|| unsafe {
            let job = CreateJobObjectW(std::ptr::null_mut(), std::ptr::null());
            if job.is_null() {
                return 0;
            }
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let ok = SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &info as *const _ as *mut winapi::ctypes::c_void,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as DWORD,
            );
            if ok == 0 {
                CloseHandle(job);
                return 0;
            }
            job as usize
        });
        if job == 0 {
            return;
        }
        unsafe {
            let handle: HANDLE = OpenProcess(winapi::um::winnt::PROCESS_ALL_ACCESS, 0, pid);
            if !handle.is_null() {
                let _ = AssignProcessToJobObject(job as HANDLE, handle);
                CloseHandle(handle);
            }
        }
    }
}

#[cfg(not(windows))]
mod job_object {
    pub fn assign(_pid: u32) {}
}
