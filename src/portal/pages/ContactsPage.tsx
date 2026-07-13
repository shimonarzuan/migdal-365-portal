import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { PageHeader, EmptyState, SearchInput, FilterBar, inputCls } from '@/shared/ui';
import { Icon, Contact, Search, Phone, Mail } from '@/shared/icons';

/** אלפון עירוני — נתוני אמת; לחיצה על עובד פותחת את דף העובד */
export default function ContactsPage({ onOpenEmployee }: { onOpenEmployee: (id: string) => void }) {
  const { data } = useData();
  const [q, setQ] = useState('');
  const [deptId, setDeptId] = useState('');

  const results = useMemo(() => data.employees
    .map((e) => ({ ...e, deptName: data.departments.find((d) => d.id === e.deptId)?.name ?? '' }))
    .filter((e) => !deptId || e.deptId === deptId)
    .filter((e) => !q.trim() || e.name.includes(q) || e.title.includes(q) || e.deptName.includes(q) || e.mobile.includes(q) || e.ext.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'he')),
  [data, q, deptId]);

  return (
    <div className="space-y-4">
      <PageHeader title="אלפון עובדים" icon={<Icon icon={Contact} size={20} />}
        subtitle={`${results.length} מתוך ${data.employees.length} עובדים`} />

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="חיפוש לפי שם, תפקיד, אגף או טלפון…" ariaLabel="חיפוש עובדים" />
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} aria-label="סינון לפי אגף" className={inputCls + ' sm:w-52'}>
          <option value="">כל האגפים</option>
          {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </FilterBar>

      {results.length === 0
        ? <EmptyState title="לא נמצאו עובדים" description="נסו לשנות את מונחי החיפוש או את סינון האגף." icon={<Icon icon={Search} size={28} />} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {results.map((e) => (
              <div key={e.id} className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]">
                <button onClick={() => onOpenEmployee(e.id)} className="flex items-center gap-3 w-full text-right cursor-pointer">
                  <span className="size-10 shrink-0 grid place-items-center rounded-full bg-[var(--accent)] text-[var(--primary-dark)] text-sm font-bold">
                    {e.firstName[0] ?? ''}{e.lastName[0] ?? ''}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm text-[var(--text)] truncate">{e.name}</strong>
                    <small className="block text-xs text-[var(--text-muted)] truncate">{e.title || '—'} · {e.deptName}</small>
                  </span>
                </button>
                <div className="flex gap-1.5 mt-2.5">
                  {e.mobile && <a href={`tel:${e.mobile}`} className="flex-1 flex items-center justify-center gap-1 text-xs bg-[var(--accent)] text-[var(--primary-dark)] rounded-[var(--radius-sm)] py-2 hover:bg-[var(--primary)] hover:text-white transition-colors"><Icon icon={Phone} size={13} /> נייד</a>}
                  {e.ext && <a href={`tel:${e.ext}`} className="flex-1 flex items-center justify-center gap-1 text-xs bg-[var(--surface-sunken)] text-[var(--text-secondary)] rounded-[var(--radius-sm)] py-2 hover:bg-[var(--surface-active)] transition-colors"><Icon icon={Phone} size={13} /> שלוחה</a>}
                  {e.email && <a href={`mailto:${e.email}`} className="flex-1 flex items-center justify-center gap-1 text-xs bg-[var(--surface-sunken)] text-[var(--text-secondary)] rounded-[var(--radius-sm)] py-2 hover:bg-[var(--surface-active)] transition-colors"><Icon icon={Mail} size={13} /> מייל</a>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
