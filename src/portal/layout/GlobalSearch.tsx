import { useMemo, useState, useRef, useEffect } from 'react';
import { useData } from '@/shared/DataContext';
import { searchDirectory, type SearchResult } from '@/services/directoryService';
import { Icon, Search, Contact, Building2, FolderClosed, ExternalLink, type LucideIcon } from '@/shared/icons';

const KIND_ICON: Record<SearchResult['kind'], LucideIcon> = {
  employee: Contact, department: Building2, procedure: FolderClosed, link: ExternalLink,
};

/** חיפוש חכם מרכזי — נהלים, אגפים, אנשי קשר ומערכות (כפוף להרשאות) */
export default function GlobalSearch({ onOpenDept }: { onOpenDept: (id: string) => void }) {
  const { data, canSeeInternal } = useData();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // כל החיפוש עובר דרך directoryService — לא ניגשים לנתונים ישירות
  const results = useMemo<SearchResult[]>(() => searchDirectory(
    { employees: data.employees, departments: data.departments, procedures: data.procedures, links: data.links },
    q, canSeeInternal,
  ), [q, data, canSeeInternal]);

  const act = (r: SearchResult) => {
    if (r.kind === 'link') window.open(r.targetId, '_blank');
    else if (r.kind === 'employee') onOpenDept(data.employees.find((e) => e.id === r.targetId)?.deptId ?? '');
    else onOpenDept(r.targetId);
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-xl mx-auto">
      <span aria-hidden className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
        <Icon icon={Search} size={16} />
      </span>
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="חיפוש נהלים, אנשי קשר, מערכות…"
        aria-label="חיפוש כללי"
        className="w-full h-9 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] ps-9 pe-3 text-sm focus:outline-2 focus:outline-[var(--focus-ring)] focus:bg-[var(--surface)] focus:border-[var(--primary)] transition-colors"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full mt-2 inset-x-0 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] overflow-hidden z-[var(--z-dropdown)]">
          {results.length === 0 && <p className="p-4 text-sm text-[var(--text-muted)]">לא נמצאו תוצאות עבור "{q}"</p>}
          {results.map((r, i) => (
            <button key={i} onClick={() => { act(r); setOpen(false); setQ(''); }}
                    className="w-full text-right flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
              <span className="shrink-0 grid place-items-center size-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden>
                <Icon icon={KIND_ICON[r.kind]} size={16} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm truncate">{r.title}</strong>
                <small className="block text-xs text-[var(--text-muted)] truncate">{r.sub}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
