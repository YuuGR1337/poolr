use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::Manager;

pub struct CollaborationRuntime {
    pub executable: PathBuf,
    pub gate: Arc<Mutex<()>>,
}

#[tauri::command]
pub async fn collaboration_command(
    app: tauri::AppHandle,
    request: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let runtime = app
        .try_state::<CollaborationRuntime>()
        .ok_or("The bundled collaboration engine is unavailable.")?;
    let executable = runtime.executable.clone();
    let gate = runtime.gate.clone();
    let input = serde_json::to_vec(&request).map_err(|_| "Invalid request")?;
    if input.len() > 2 * 1024 * 1024 {
        return Err("Request exceeds the collaboration size limit.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = gate
            .lock()
            .map_err(|_| "Collaboration worker unavailable")?;
        let mut command = Command::new(executable);
        command.arg("--collaboration-command");
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x0800_0000);
        }
        let mut child = command
            .spawn()
            .map_err(|_| "Could not start collaboration engine")?;
        let stdout = child.stdout.take().ok_or("Missing response pipe")?;
        let reader = std::thread::spawn(move || {
            let mut bytes = Vec::new();
            stdout
                .take(8 * 1024 * 1024 + 1)
                .read_to_end(&mut bytes)
                .map(|_| bytes)
        });
        let write = child
            .stdin
            .take()
            .ok_or("Missing input pipe")?
            .write_all(&input);
        if write.is_err() {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Could not send collaboration request".into());
        }
        let started = Instant::now();
        loop {
            if child
                .try_wait()
                .map_err(|_| "Worker status unavailable")?
                .is_some()
            {
                break;
            }
            if started.elapsed() > Duration::from_secs(180) {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Collaboration timed out. Pending local data is retained.".into());
            }
            std::thread::sleep(Duration::from_millis(25));
        }
        let output = reader
            .join()
            .map_err(|_| "Response reader failed")?
            .map_err(|_| "Could not read collaboration response")?;
        if output.len() > 8 * 1024 * 1024 {
            return Err("Workspace response exceeds the safety limit.".into());
        }
        let response: serde_json::Value =
            serde_json::from_slice(&output).map_err(|_| "Invalid engine response")?;
        if response["ok"] != true {
            return Err(response["error"]
                .as_str()
                .unwrap_or("Collaboration failed")
                .to_string());
        }
        Ok(response["result"].clone())
    })
    .await
    .map_err(|_| "Collaboration worker stopped")?
}
