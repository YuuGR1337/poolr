import { useState, useEffect, useCallback, useRef } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { APP_VERSION } from './version';
import { loadSettings, saveSettings } from './settings';

export interface UpdateInfo { available: boolean; version: string; body?: string; date?: string }
export function useUpdater() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const update = useRef<Update | null>(null);
  const checkForUpdates = useCallback(async () => {
    if (!isTauri()) { setError('Update checks are available in the desktop app.'); return; }
    setChecking(true); setError('');
    try {
      const next = await check();
      await update.current?.close(); update.current = next;
      setUpdateInfo({ available: !!next, version: next?.version ?? APP_VERSION, body: next?.body, date: next?.date });
      const settings = loadSettings(); settings.lastUpdateCheck = new Date().toISOString(); saveSettings(settings);
    } catch (e) { setUpdateInfo(null); setError(String(e)); }
    finally { setChecking(false); }
  }, []);
  const downloadUpdate = useCallback(async () => {
    if (!update.current) return;
    setChecking(true); setError('');
    try { await update.current.downloadAndInstall(); }
    catch (e) { setError(String(e)); }
    finally { setChecking(false); }
  }, []);
  useEffect(() => {
    const automatic = () => { if (isTauri() && loadSettings().autoUpdateEnabled !== false) void checkForUpdates(); };
    automatic(); const interval = setInterval(automatic, 86400000);
    return () => { clearInterval(interval); void update.current?.close(); };
  }, [checkForUpdates]);
  return { updateInfo, checking, error, checkForUpdates, downloadUpdate };
}
