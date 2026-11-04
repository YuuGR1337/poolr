import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Key, Globe, BookOpen, Database as DatabaseIcon, FileText, Search, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DatabaseInfo {
  id: string;
  name: string;
  description: string;
  free: boolean;
  logo: string;
  color: string;
  category: 'biomedical' | 'multidisciplinary' | 'registry' | 'preprint';
  url: string;
}

export const DATABASES: DatabaseInfo[] = [
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'Biomedical literature from MEDLINE, life science journals, and online books',
    free: true,
    logo: '🅿️',
    color: '#326295',
    category: 'biomedical',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'clinicaltrials',
    name: 'ClinicalTrials.gov',
    description: 'Database of clinical studies conducted around the world',
    free: true,
    logo: '🏥',
    color: '#0071bc',
    category: 'registry',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'prospero',
    name: 'PROSPERO',
    description: 'International prospective register of systematic reviews',
    free: true,
    logo: '📋',
    color: '#2c5282',
    category: 'registry',
    url: 'https://www.crd.york.ac.uk/prospero/',
  },
  {
    id: 'cochrane',
    name: 'Cochrane Library',
    description: 'High-quality evidence for healthcare decision making',
    free: true,
    logo: '🌐',
    color: '#00a65a',
    category: 'biomedical',
    url: 'https://www.cochranelibrary.com/',
  },
  {
    id: 'openalex',
    name: 'OpenAlex',
    description: 'Open catalog of the world\'s scholarly works',
    free: true,
    logo: '📚',
    color: '#6366f1',
    category: 'multidisciplinary',
    url: 'https://openalex.org/',
  },
  {
    id: 'crossref',
    name: 'Crossref',
    description: 'Digital object identifiers and metadata for scholarly content',
    free: true,
    logo: '🔗',
    color: '#f89839',
    category: 'multidisciplinary',
    url: 'https://www.crossref.org/',
  },
  {
    id: 'google_scholar',
    name: 'Google Scholar',
    description: 'Broadly search for scholarly literature across disciplines',
    free: true,
    logo: '🎓',
    color: '#4285f4',
    category: 'multidisciplinary',
    url: 'https://scholar.google.com/',
  },
  {
    id: 'embase',
    name: 'Embase',
    description: 'Biomedical and pharmacological database (Elsevier)',
    free: false,
    logo: '🔬',
    color: '#e31937',
    category: 'biomedical',
    url: 'https://www.embase.com/',
  },
  {
    id: 'scopus',
    name: 'Scopus',
    description: 'Abstract and citation database (Elsevier)',
    free: false,
    logo: '📊',
    color: '#e9711c',
    category: 'multidisciplinary',
    url: 'https://www.scopus.com/',
  },
  {
    id: 'wos',
    name: 'Web of Science',
    description: 'Citation database (Clarivate)',
    free: false,
    logo: '🌍',
    color: '#5e33bf',
    category: 'multidisciplinary',
    url: 'https://www.webofscience.com/',
  },
];

interface DatabaseSelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  showCategories?: boolean;
  className?: string;
}

export default function DatabaseSelector({
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  showCategories = true,
  className,
}: DatabaseSelectorProps) {
  const [filter, setFilter] = useState<'all' | 'free' | 'key'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDatabases = DATABASES.filter((db) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'free' && db.free) ||
      (filter === 'key' && !db.free);

    const matchesSearch =
      !searchTerm ||
      db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const categories = showCategories
    ? [
        { id: 'biomedical', label: 'Biomedical', icon: BookOpen },
        { id: 'multidisciplinary', label: 'Multidisciplinary', icon: Globe },
        { id: 'registry', label: 'Registries', icon: FileText },
      ]
    : [];

  const groupedDatabases = categories.length
    ? categories.map((cat) => ({
        ...cat,
        databases: filteredDatabases.filter((db) => db.category === cat.id),
      }))
    : [{ id: 'all', label: 'All Databases', icon: DatabaseIcon, databases: filteredDatabases }];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search databases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-[12.5px] text-[var(--color-text)] placeholder:text-[var(--placeholder-fg)] focus-visible:border-[var(--color-border-strong)] focus-visible:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'free', 'key'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors',
                filter === f
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
              )}
            >
              {f === 'all' ? 'All' : f === 'free' ? 'Free' : 'Key Required'}
            </button>
          ))}
        </div>
        {onSelectAll && onClearAll && (
          <div className="flex gap-1">
            <button
              onClick={onSelectAll}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Database count */}
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span>{selected.length} of {DATABASES.length} selected</span>
        <span>{filteredDatabases.length} shown</span>
      </div>

      {/* Database grid */}
      <div className="space-y-6">
        {groupedDatabases.map((group) => (
          <div key={group.id}>
            {showCategories && group.databases.length > 0 && (
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[var(--color-text)]">
                <group.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                {group.label}
                <span className="text-[10.5px] text-[var(--color-text-muted)]">
                  ({group.databases.length})
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.databases.map((db) => {
                const isSelected = selected.includes(db.id);
                return (
                  <motion.button
                    key={db.id}
                    onClick={() => onToggle(db.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-sm'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--hover-surface)]'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        isSelected
                          ? 'border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500 text-white'
                          : 'border-[var(--color-border)] bg-[var(--input-bg)]'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    {/* Logo */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: `${db.color}15` }}
                    >
                      <img src={new URL(db.url).origin + '/favicon.ico'} alt="" className="h-5 w-5 object-contain" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[var(--color-text)]">
                          {db.name}
                        </span>
                        {db.free ? (
                          <span className="rounded-full bg-[var(--color-include)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-include)]">
                            FREE
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 rounded-full bg-[var(--color-unsure)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-unsure)]">
                            <Key className="h-2.5 w-2.5" />
                            KEY
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10.5px] text-[var(--color-text-muted)]">
                        {db.description}
                      </p>
                    </div>

                    {/* External link */}
                    <a
                      href={db.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    </a>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredDatabases.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] py-8 text-center text-[12.5px] text-[var(--color-text-muted)]">
          No databases match your search criteria
        </div>
      )}
    </div>
  );
}