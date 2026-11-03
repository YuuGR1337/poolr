import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Sparkles, Users, Search, Settings, FileText } from 'lucide-react';
import { Input, Button } from './ui';

import type { ProjectConfig } from '../lib/project';

interface Props {
  onComplete?: (config: ProjectConfig) => void;
  onCancel: () => void;
}

const STUDY_TYPES = [
  { id: 'standard', name: 'Pairwise intervention review', desc: 'Compare two interventions using study-level effects' },
  { id: 'network', name: 'Network MA', desc: 'Multiple treatments, SUCRA rankings' },
  { id: 'ipd', name: 'IPD Meta', desc: 'Individual participant data' },
  { id: 'multilevel', name: 'Multilevel', desc: 'Dependent effect sizes' },
  { id: 'diagnostic', name: 'Diagnostic', desc: 'SROC, sensitivity/specificity' },
  { id: 'proportions', name: 'Proportions', desc: 'Single-arm pooling' },
  { id: 'qualitative', name: 'Qualitative synthesis', desc: 'Thematic synthesis, without numerical pooling' },
  { id: 'manual', name: 'Manual', desc: 'Full control, no guided workflow' },
];

const REVIEW_TYPES = [
  'Systematic Review',
  'Systematic Review + Meta-Analysis',
  'Scoping Review',
  'Umbrella Review',
  'Living Review',
];

const DATABASES = [
  { id: 'pubmed', name: 'PubMed', free: true },
  { id: 'cochrane', name: 'Cochrane', free: true },
  { id: 'clinicaltrials', name: 'ClinicalTrials.gov', free: true },
  { id: 'openalex', name: 'OpenAlex', free: true },
  { id: 'crossref', name: 'Crossref', free: true },
  { id: 'prospero', name: 'PROSPERO', free: true },
  { id: 'embase', name: 'Embase', free: false },
  { id: 'scopus', name: 'Scopus', free: false },
  { id: 'wos', name: 'Web of Science', free: false },
  { id: 'google_scholar', name: 'Google Scholar', free: true },
];

const AI_FEATURES = [
  { id: 'screening', name: 'AI Screening', desc: 'Multi-model consensus screening' },
  { id: 'extraction', name: 'AI Extraction', desc: 'PDF data extraction' },
  { id: 'rob', name: 'AI Risk of Bias', desc: 'Suggest RoB ratings' },
  { id: 'interpret', name: 'AI Interpretation', desc: 'Plain-language results' },
  { id: 'manuscript', name: 'AI Manuscript', desc: 'Draft manuscript sections' },
];

export default function NewProjectWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ProjectConfig>({
    title: '',
    studyType: 'standard',
    reviewType: 'Systematic Review + Meta-Analysis',
    reviewers: [{ id: '1', name: 'Reviewer 1' }],
    dualScreening: false,
    aiEnabled: false,
    aiFeatures: [],
    databases: ['pubmed', 'cochrane'],
    pico: { population: '', intervention: '', comparator: '', outcomes: '' },
    searchStrategy: {},
  });

  const steps = [
    { title: 'Study Identity', icon: FileText },
    { title: 'Team & Workflow', icon: Users },
    { title: 'PICO Definition', icon: Search },
    { title: 'Search Strategy', icon: Search },
    { title: 'AI Configuration', icon: Sparkles },
    { title: 'Review & Create', icon: Settings },
  ];

  const update = (patch: Partial<ProjectConfig>) => setConfig({ ...config, ...patch });

  const toggleDatabase = (id: string) => {
    const dbs = config.databases.includes(id)
      ? config.databases.filter(d => d !== id)
      : [...config.databases, id];
    update({ databases: dbs });
  };

  const toggleAIFeature = (id: string) => {
    const features = config.aiFeatures.includes(id)
      ? config.aiFeatures.filter(f => f !== id)
      : [...config.aiFeatures, id];
    update({ aiFeatures: features });
  };

  const setReviewers = (n: number) => {
    const reviewers = Array.from({ length: n }, (_, i) => ({
      id: `${i + 1}`,
      name: config.reviewers[i]?.name || `Reviewer ${i + 1}`,
    }));
    update({ reviewers, dualScreening: n >= 2 });
  };

  const canProceed = () => {
    if (step === 0) return config.title.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete?.(config);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-auto bg-black/50 p-6 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-[16px] font-semibold">Create New Review</h2>
          <div className="mt-3 flex gap-1">
            {steps.map((_s, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Study Title</label>
                    <Input
                      value={config.title}
                      onChange={e => update({ title: e.target.value })}
                      placeholder="e.g., Effect of exercise on depression in adults"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Study Type</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {STUDY_TYPES.map(st => (
                        <button
                          key={st.id}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            config.studyType === st.id
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                          }`}
                          onClick={() => update({ studyType: st.id })}
                        >
                          <div className="text-[12px] font-medium">{st.name}</div>
                          <div className="text-[10.5px] text-[var(--color-text-muted)]">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.studyType === 'standard' && <label className="block text-xs">Outcome preset<select className="select w-full mt-2" value={config.effectMeasure || 'OR'} onChange={e => update({ effectMeasure: e.target.value })}><option value="OR">Binary events — odds ratio</option><option value="RR">Binary events — risk ratio</option><option value="RD">Binary events — risk difference</option><option value="MD">Continuous, same scale — mean difference</option><option value="SMD">Continuous, different scales — standardized mean difference</option><option value="HR">Time to event — hazard ratio</option></select></label>}
                  <p className="text-xs text-[var(--color-text-muted)]">Choose the design and outcome before inspecting results. Presets initialize the workspace; they do not determine whether pooling is appropriate. <a href="https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10" target="_blank" rel="noreferrer" className="underline">Cochrane methods guide</a></p>
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Review Type</label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {REVIEW_TYPES.map(rt => (
                        <button
                          key={rt}
                          className={`btn-ghost text-[11px] ${config.reviewType === rt ? '!text-[var(--color-text)] !border-[var(--color-border-strong)]' : ''}`}
                          onClick={() => update({ reviewType: rt })}
                        >
                          {rt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Number of Reviewers</label>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          className={`btn-ghost ${config.reviewers.length === n ? '!text-[var(--color-text)] !border-[var(--color-border-strong)]' : ''}`}
                          onClick={() => setReviewers(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.reviewers.map((r, i) => (
                    <div key={r.id}>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Reviewer {i + 1} Name</label>
                      <Input
                        value={r.name}
                        onChange={e => {
                          const reviewers = [...config.reviewers];
                          reviewers[i] = { ...reviewers[i], name: e.target.value };
                          update({ reviewers });
                        }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.dualScreening}
                      onChange={e => update({ dualScreening: e.target.checked })}
                    />
                    <span className="text-[12px]">Enable dual independent screening</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Research Question</label>
                    <textarea
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
                      rows={2}
                      placeholder="e.g., In adults with depression, does exercise compared to no exercise improve symptoms?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Population</label>
                      <textarea
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
                        rows={2}
                        value={config.pico.population}
                        onChange={e => update({ pico: { ...config.pico, population: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Intervention</label>
                      <textarea
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
                        rows={2}
                        value={config.pico.intervention}
                        onChange={e => update({ pico: { ...config.pico, intervention: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Comparator</label>
                      <textarea
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
                        rows={2}
                        value={config.pico.comparator}
                        onChange={e => update({ pico: { ...config.pico, comparator: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-[var(--color-text-muted)]">Outcomes</label>
                      <textarea
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] px-3 py-2 text-[12px] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
                        rows={2}
                        value={config.pico.outcomes}
                        onChange={e => update({ pico: { ...config.pico, outcomes: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Select Databases</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {DATABASES.map(db => (
                        <button
                          key={db.id}
                          className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                            config.databases.includes(db.id)
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                          }`}
                          onClick={() => toggleDatabase(db.id)}
                        >
                          <input type="checkbox" checked={config.databases.includes(db.id)} readOnly />
                          <span className="text-[12px]">{db.name}</span>
                          {!db.free && <span className="text-[10px] text-[var(--color-unsure)]">🔑</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.aiEnabled}
                      onChange={e => update({ aiEnabled: e.target.checked })}
                    />
                    <span className="text-[12px] font-medium">Enable AI Features</span>
                  </div>
                  {config.aiEnabled && (
                    <div className="space-y-2">
                      {AI_FEATURES.map(f => (
                        <button
                          key={f.id}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                            config.aiFeatures.includes(f.id)
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                          }`}
                          onClick={() => toggleAIFeature(f.id)}
                        >
                          <input type="checkbox" checked={config.aiFeatures.includes(f.id)} readOnly />
                          <div>
                            <div className="text-[12px] font-medium">{f.name}</div>
                            <div className="text-[10.5px] text-[var(--color-text-muted)]">{f.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <h3 className="text-[14px] font-semibold">Review Your Configuration</h3>
                  <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-[12px]">
                    <div><span className="text-[var(--color-text-muted)]">Title:</span> {config.title}</div>
                    <div><span className="text-[var(--color-text-muted)]">Type:</span> {config.studyType} ({config.reviewType})</div>
                    <div><span className="text-[var(--color-text-muted)]">Reviewers:</span> {config.reviewers.length} {config.dualScreening && '(dual screening)'}</div>
                    <div><span className="text-[var(--color-text-muted)]">Databases:</span> {config.databases.join(', ')}</div>
                    <div><span className="text-[var(--color-text-muted)]">AI:</span> {config.aiEnabled ? config.aiFeatures.join(', ') : 'Disabled'}</div>
                    <div><span className="text-[var(--color-text-muted)]">PICO:</span> {config.pico.population || '—'} / {config.pico.intervention || '—'} / {config.pico.comparator || '—'} / {config.pico.outcomes || '—'}</div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4">
          <button className="btn-ghost" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <div className="text-[11px] text-[var(--color-text-muted)]">Step {step + 1} of {steps.length}</div>
          <Button variant="default" onClick={handleNext} disabled={!canProceed()}>
            {step === steps.length - 1 ? 'Create Project' : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
