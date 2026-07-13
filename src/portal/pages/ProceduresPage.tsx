import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Badge, Empty, PageHeader, SearchInput, FilterBar, inputCls } from '@/shared/ui';
import { Icon, FolderClosed } from '@/shared/icons';
import { formByProcedure } from '@/services/formsService';
import type { Procedure } from '@/types';

const fmtDate = (d?: string) => (d ? d.slice(5).split('-').reverse().join('/') : '');
const DAY_MS = 24 * 60 * 60 * 1000;
const withinDays = (d: string | undefined, days: number): boolean => {
  if (!d) return false;
  const diff = Date.now() - new Date(d).getTime();
  return diff >= 0 && diff <= days * DAY_MS;
};

/** מרכז נהלים — חיפוש, חלוקה לפי אגפים, תגיות חדש/עודכן/מחייב חתימה */
export default function ProceduresPage({ onOpenDept, onOpenForm }: {
  onOpenDept: (id: string) => void;
  onOpenForm: (formId: string) => void;
}) {
  const { data, canSeeInternal, hasSigned, sign } = useData();
  const [q, setQ] = useState('');
  const [deptId, setDeptId] = useState('');

  const visible = useMemo(() => data.procedures
    .filter((p) => canSeeInternal(p.deptId) || !p.internal)
    .filter((p) => !deptId || p.deptId === deptId)
    .filter((p) => !q.trim() || p.title.includes(q) || p.description.includes(q)),
  [data, q, deptId, canSeeInternal]);

  const recentlyUpdated = useMemo(() => [...visible]
    .filter((p) => withinDays(p.updatedAt, 14))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3),
  [visible]);

  const groups = useMemo(() => {
    const byDept = new Map<string, Procedure[]>();
    for (const p of visible) byDept.set(p.deptId, [...(byDept.get(p.deptId) ?? []), p]);
    return [...byDept.entries()]
      .map(([id, items]) => ({ dept: data.departments.find((d) => d.id === id), items }))
      .sort((a, b) => (a.dept?.name ?? '').localeCompare(b.dept?.name ?? '', 'he'));
  }, [visible, data.departments]);

  const renderProcedure = (p: Procedure) => {
    const dept = data.departments.find((d) => d.id === p.deptId);
    const isNew = withinDays(p.createdAt, 14);
    const isUpdated = !isNew && withinDays(p.updatedAt, 14) && p.updatedAt !== p.createdAt;
    const linkedForm = formByProcedure(data.formDefinitions, p.id);
    return (
      <article key={p.id} className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 hover:border-[var(--primary)] transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-sm text-[var(--text)]">{p.title}</strong>
            <button onClick={() => onOpenDept(p.deptId)} className="cursor-pointer" title="מעבר לעמוד האגף">
              <Badge tone="neutral">{dept?.icon} {dept?.name}</Badge>
            </button>
            {p.internal && <Badge tone="warning">פנימי</Badge>}
            {isNew && <Badge tone="success">חדש</Badge>}
            {isUpdated && <Badge tone="teal">עודכן</Badge>}
            {p.requiresReadAndSign && <Badge tone="danger">מחייב קרא וחתום</Badge>}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {p.description} · עודכן {fmtDate(p.updatedAt)}{p.owner ? ` · גורם אחראי: ${p.owner}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {linkedForm && (
            <button onClick={() => onOpenForm(linkedForm.id)}
                    className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">📋 טופס דיגיטלי</button>
          )}
          <button onClick={() => alert(`פתיחת קובץ: ${p.title} (דמו)`)}
                  className="text-xs border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 cursor-pointer">פתח PDF</button>
          {p.requiresReadAndSign && (hasSigned(p.id)
            ? <Badge tone="green">✓ נחתם</Badge>
            : <button onClick={() => sign(p.id)} className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">קראתי ואישרתי</button>)}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="מרכז נהלים" icon={<Icon icon={FolderClosed} size={20} />} subtitle="נהלי העירייה לפי אגף — כולל חיפוש, סימון נהלים חדשים ומעודכנים וחתימת קרא-וחתום" />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="חיפוש נוהל…" ariaLabel="חיפוש נוהל" />
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} aria-label="סינון לפי אגף" className={inputCls + ' sm:w-52'}>
          <option value="">כל האגפים</option>
          {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </FilterBar>

      {recentlyUpdated.length > 0 && (
        <section className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3">
          <h2 className="text-xs font-bold text-[var(--primary-dark)] mb-2">🕘 נהלים שעודכנו לאחרונה</h2>
          <div className="flex flex-wrap gap-1.5">
            {recentlyUpdated.map((p) => (
              <span key={p.id} className="text-xs bg-[var(--accent)] text-[var(--primary-dark)] rounded-full px-2.5 py-1">{p.title} · {fmtDate(p.updatedAt)}</span>
            ))}
          </div>
        </section>
      )}

      {visible.length === 0 && <Empty text="לא נמצאו נהלים." />}

      <div className="space-y-4">
        {groups.map(({ dept, items }) => (
          <div key={dept?.id ?? 'other'} className="space-y-2">
            {!deptId && <h2 className="text-xs font-bold text-[var(--text-muted)]">{dept?.icon} {dept?.name ?? 'אגף לא ידוע'}</h2>}
            <div className="space-y-2">{items.map(renderProcedure)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
