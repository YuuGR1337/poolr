import { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Pill } from '../components/ui';
import { loadProviders, saveProviders, PROVIDER_TEMPLATES, refreshModels, initiateOAuth, type AIProvider } from '../lib/ai';
import { loadSettings, saveSettings, type PoolrSettings } from '../lib/settings';
import { applyThemeClass } from '../lib/theme';
import { APP_VERSION } from '../lib/version';
import { useUpdater } from '../lib/updater';


type Tab = 'ai' | 'cloud' | 'databases' | 'appearance' | 'screening' | 'export' | 'updates';

const DB_KEYS = [
  { id: 'scopus', name: 'Scopus (Elsevier)', link: 'https://dev.elsevier.com' },
  { id: 'wos', name: 'Web of Science (Clarivate)', link: 'https://developer.clarivate.com' },
  { id: 'embase', name: 'Embase (Elsevier)', link: 'https://dev.elsevier.com' },
  { id: 'crossref', name: 'Crossref', link: 'https://www.crossref.org' },
  { id: 'openalex', name: 'OpenAlex', link: 'https://openalex.org' },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('ai');
  const [providers, setProviders] = useState<AIProvider[]>(loadProviders());
  const [settings, setSettings] = useState<PoolrSettings>(loadSettings());
  const [dbKeys, setDbKeys] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('poolr.dbKeys') || '{}'); } catch { return {}; }
  });

  // Apply settings that affect the whole app
  useEffect(() => {
    // Apply density
    document.body.classList.toggle('density-compact', settings.appearance.density === 'compact');
    document.body.classList.toggle('density-comfortable', settings.appearance.density === 'comfortable');
  }, [settings.appearance.density]);

  useEffect(() => {
    // Apply font size
    document.documentElement.style.setProperty('--base-font-size', `${settings.appearance.fontSize}px`);
    document.body.style.fontSize = `${settings.appearance.fontSize}px`;
  }, [settings.appearance.fontSize]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ai', label: 'AI Providers' },
    { key: 'cloud', label: 'Cloud & Accounts' },
    { key: 'databases', label: 'Databases' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'screening', label: 'Screening' },
    { key: 'export', label: 'Export' },
    { key: 'updates', label: 'Updates' },
  ];

  const updateProvider = (id: string, patch: Partial<AIProvider>) => {
    const next = providers.map(p => p.id === id ? { ...p, ...patch } : p);
    setProviders(next);
    saveProviders(next);
  };

  const removeProvider = (id: string) => {
    const next = providers.filter(p => p.id !== id);
    setProviders(next);
    saveProviders(next);
  };

  const [testStatus, setTestStatus] = useState<Record<string, "idle" | "ok" | "fail">>({});
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const { updateInfo, checking, error: updateError, checkForUpdates, downloadUpdate } = useUpdater();

  const testConnection = async (provider: AIProvider) => {
    setTestStatus(prev => ({ ...prev, [provider.id]: "idle" }));
    try {
      const res = await fetch(`${provider.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${provider.apiKey}` },
      });
      if (res.ok) {
        setTestStatus(prev => ({ ...prev, [provider.id]: "ok" }));
        // Update provider connected status
        const providers = loadProviders();
        const p = providers.find(x => x.id === provider.id);
        if (p) { p.connected = true; saveProviders(providers); }
        setProviders(prev => prev.map(pp => pp.id === provider.id ? { ...pp, connected: true } : pp));
      } else {
        setTestStatus(prev => ({ ...prev, [provider.id]: "fail" }));
      }
      setTimeout(() => setTestStatus(prev => ({ ...prev, [provider.id]: "idle" })), 3000);
    } catch {
      setTestStatus(prev => ({ ...prev, [provider.id]: "fail" }));
      setTimeout(() => setTestStatus(prev => ({ ...prev, [provider.id]: "idle" })), 3000);
    }
  };

  const handleRefreshModels = async (provider: AIProvider) => {
    setRefreshing(prev => ({ ...prev, [provider.id]: true }));
    const models = await refreshModels(provider);
    setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, models } : p));
    setRefreshing(prev => ({ ...prev, [provider.id]: false }));
  };

  const handleOAuthConnect = (provider: string) => {
    initiateOAuth(provider);
  };

  const addProviderFromTemplate = (providerKey: string) => {
    const template = PROVIDER_TEMPLATES[providerKey];
    if (!template) return;
    const newProvider: AIProvider = {
      id: `provider_${Date.now()}`,
      name: template.name,
      provider: template.provider,
      baseUrl: template.baseUrl,
      apiKey: '',
      model: template.defaultModel,
      models: [],
      dailyLimit: 1000,
      requestsUsed: 0,
      lastReset: new Date().toISOString().split('T')[0],
      maxConcurrent: 5,
      temperature: 0.1,
      maxTokens: 4096,
      enabled: true,
      connected: false,
      oauthSupported: template.oauthSupported,
      oauthConnected: false,
    };
    const next = [...providers, newProvider];
    setProviders(next);
    saveProviders(next);
  };

  const updateDbKey = (id: string, value: string) => {
    const next = { ...dbKeys, [id]: value };
    setDbKeys(next);
    localStorage.setItem('poolr.dbKeys', JSON.stringify(next));
  };

  const updateAppearance = (patch: Partial<PoolrSettings['appearance']>) => {
    const next = { ...settings, appearance: { ...settings.appearance, ...patch } };
    setSettings(next);
    saveSettings(next);
    if (patch.theme) applyThemeClass(patch.theme);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`btn-ghost ${tab === t.key ? '!text-[var(--color-text)] !border-[var(--color-border-strong)]' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ai' && (
        <div className="space-y-3">
          <Card title="AI Providers" right={
            <div className="flex items-center gap-2">
              <Select onChange={(e) => addProviderFromTemplate(e.target.value)} value="" className="text-[12px]">
                <option value="" disabled>+ Add Provider</option>
                {Object.keys(PROVIDER_TEMPLATES).filter(k => !providers.some(p => p.provider === k)).map(k => (
                  <option key={k} value={k}>{PROVIDER_TEMPLATES[k].name}</option>
                ))}
              </Select>
            </div>
          }>
            <p className="mb-3 text-[12px] text-[var(--color-text-muted)]">
              Configure AI providers for screening assistance. All providers require an API key or OAuth connection.
            </p>
            {providers.length === 0 && (
              <div className="rounded-[5px] border border-dashed border-[var(--color-border)] p-6 text-center text-[12px] text-[var(--color-text-muted)]">
                No providers configured. Select a provider above to get started.
              </div>
            )}
            {providers.map(p => (
              <div key={p.id} className="mb-3 rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={p.enabled} onChange={e => updateProvider(p.id, { enabled: e.target.checked })} />
                    <span className="text-[13px] font-medium">{p.name}</span>
                    {p.connected ? (
                      <Pill tone="success">Connected</Pill>
                    ) : (
                      <Pill tone="warning">Disconnected</Pill>
                    )}
                    {p.oauthSupported && (
                      <Pill tone="info">OAuth</Pill>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {p.oauthSupported && !p.oauthConnected && (
                      <Button variant="ghost" size="sm" onClick={() => handleOAuthConnect(p.provider)}>
                        Sign In
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => testConnection(p)} disabled={!p.apiKey}>
                      {testStatus[p.id] === "ok" ? "✓ Connected" : testStatus[p.id] === "fail" ? "✗ Failed" : "Test"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRefreshModels(p)} disabled={!p.apiKey || refreshing[p.id]}>
                      {refreshing[p.id] ? "..." : "↻"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeProvider(p.id)}>Remove</Button>
                  </div>
                </div>
                {!p.oauthSupported && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">API Key</label>
                      <Input type="password" value={p.apiKey} onChange={e => updateProvider(p.id, { apiKey: e.target.value })} placeholder="sk-..." />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Model</label>
                      {p.models.length > 0 ? (
                        <Select value={p.model} onChange={e => updateProvider(p.id, { model: e.target.value })}>
                          {p.models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input value={p.model} onChange={e => updateProvider(p.id, { model: e.target.value })} placeholder="model name" />
                      )}
                    </div>
                  </div>
                )}
                {p.lastModelRefresh && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Models refreshed: {new Date(p.lastModelRefresh).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'cloud' && (
        <p className="text-sm text-[var(--color-text-muted)]">Drive access is managed by rclone. Open Team workspace to connect your configured remote and manage your signing identity.</p>
      )}

      {tab === 'databases' && (
        <Card title="External Database APIs">
          <p className="mb-3 text-[12px] text-[var(--color-text-muted)]">
            Configure API keys for external databases. Some require registration.
          </p>
          <div className="space-y-2">
            {DB_KEYS.map(db => (
              <div key={db.id} className="flex items-center gap-2">
                <span className="w-40 text-[12px]">{db.name}</span>
                <Input type="password" placeholder="API Key (optional)" className="flex-1" value={dbKeys[db.id] || ''} onChange={e => updateDbKey(db.id, e.target.value)} />
                <a href={db.link} target="_blank" rel="noopener" className="text-[11px] text-[var(--color-accent)]">Get Key</a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card title="Appearance">
          <div className="space-y-3">
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Theme</label>
              <Select value={settings.appearance.theme} onChange={e => updateAppearance({ theme: e.target.value as 'light' | 'dark' })}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </Select>
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Dock Style</label>
              <Select value={settings.appearance.dockStyle} onChange={e => updateAppearance({ dockStyle: e.target.value as any })}>
                <option value="colorful">Colorful</option>
                <option value="monochrome">Monochrome</option>
                <option value="minimal">Minimal</option>
              </Select>
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Density</label>
              <Select value={settings.appearance.density} onChange={e => updateAppearance({ density: e.target.value as 'compact' | 'comfortable' })}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </Select>
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Font Size</label>
              <Input type="number" value={settings.appearance.fontSize} onChange={e => updateAppearance({ fontSize: parseFloat(e.target.value) || 12.5 })} />
            </div>
          </div>
        </Card>
      )}

      {tab === 'screening' && (
        <Card title="AI Screening Defaults">
          <div className="space-y-3">
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Batch Size (records per request)</label>
              <Input type="number" value={settings.ai.batchSize} onChange={e => { const next = { ...settings, ai: { ...settings.ai, batchSize: parseInt(e.target.value) || 50 } }; setSettings(next); saveSettings(next); }} />
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Auto-Accept Threshold</label>
              <Input type="number" step="0.05" min="0" max="1" value={settings.ai.autoAcceptThreshold} onChange={e => { const next = { ...settings, ai: { ...settings.ai, autoAcceptThreshold: parseFloat(e.target.value) || 0.85 } }; setSettings(next); saveSettings(next); }} />
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Human Review Threshold</label>
              <Input type="number" step="0.05" min="0" max="1" value={settings.ai.humanReviewThreshold} onChange={e => { const next = { ...settings, ai: { ...settings.ai, humanReviewThreshold: parseFloat(e.target.value) || 0.5 } }; setSettings(next); saveSettings(next); }} />
            </div>
          </div>
        </Card>
      )}

      {tab === 'export' && (
        <Card title="Export Defaults">
          <div className="space-y-3">
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Default Format</label>
              <Select value={settings.export.format} onChange={e => { const next = { ...settings, export: { ...settings.export, format: e.target.value as any } }; setSettings(next); saveSettings(next); }}>
                <option value="docx">Word (.docx)</option>
                <option value="latex">LaTeX (.tex)</option>
                <option value="json">JSON</option>
                <option value="md">Markdown</option>
              </Select>
            </div>
            <div>
              <label className="text-[10.5px] text-[var(--color-text-muted)]">Citation Style</label>
              <Select value={settings.export.citationStyle} onChange={e => { const next = { ...settings, export: { ...settings.export, citationStyle: e.target.value as any } }; setSettings(next); saveSettings(next); }}>
                <option value="vancouver">Vancouver</option>
                <option value="apa">APA</option>
                <option value="harvard">Harvard</option>
                <option value="bibtex">BibTeX</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={settings.export.includeFigures} onChange={e => { const next = { ...settings, export: { ...settings.export, includeFigures: e.target.checked } }; setSettings(next); saveSettings(next); }} />
              <span className="text-[12px]">Include figures</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={settings.export.includeRawData} onChange={e => { const next = { ...settings, export: { ...settings.export, includeRawData: e.target.checked } }; setSettings(next); saveSettings(next); }} />
              <span className="text-[12px]">Include raw data</span>
            </div>
          </div>
        </Card>
      )}

      {tab === 'updates' && (
        <Card title="Updates">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px]">Current Version</span>
              <span className="text-[12px] font-mono text-[#e6e7ea]">{APP_VERSION}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]">Auto-update</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.autoUpdateEnabled} onChange={e => { const next = { ...settings, autoUpdateEnabled: e.target.checked }; setSettings(next); saveSettings(next); }} className="sr-only peer" />
                <div className="w-9 h-5 bg-[#2a2b3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#8b8d96] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3b82f6] peer-checked:after:bg-white"></div>
              </label>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={checking}>
              {checking ? 'Checking...' : 'Check for updates now'}
            </Button>
            {updateError && <p role="alert" className="text-xs">{updateError}</p>}
            {updateInfo?.available && (
              <div className="rounded-lg bg-blue-900/30 border border-blue-500/30 p-3">
                <p className="text-blue-400 text-[12px]">New version available: {updateInfo.version}</p><Button onClick={downloadUpdate} disabled={checking}>Download and install signed update</Button>
              </div>
            )}
            {updateInfo && !updateInfo.available && (
              <p className="text-[11px] text-[#8b8d96]">You are running the latest version.</p>
            )}
            {settings.lastUpdateCheck && (
              <p className="text-[10.5px] text-[#8b8d96]">Last checked: {new Date(settings.lastUpdateCheck).toLocaleString()}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
