import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Badge, Empty, Panel, PageHeader, SearchInput } from '@/shared/ui';
import { Icon, Scale, FileText, CircleHelp, BookOpen } from '@/shared/icons';
import { RIGHTS_CATEGORIES, rightsByCategory, searchRights, recentRights } from '@/services/employeeRightsService';
import { isFormActive } from '@/services/formsService';
import type { EmployeeRightsCategory, EmployeeRightsItem } from '@/types';

const fmtDate = (d: string) => (d ? d.slice(5).split('-').reverse().join('/') : '');

/** דע את זכויותיך — מרכז מידע לעובדי העירייה בנושא זכויות עבודה */
export default function EmployeeRightsPage({ onOpenForm }: { onOpenForm: (formId: string) => void }) {
  const { data } = useData();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<EmployeeRightsCategory | ''>('');

  const filtered = useMemo(() => {
    const base = category ? rightsByCategory(data.employeeRights, category) : data.employeeRights;
    return searchRights(base, q);
  }, [data.employeeRights, category, q]);

  const docs = recentRights(data.employeeRights.filter((r) => r.documentUrl));
  const faqs = filtered.filter((r) => r.category === 'faq');
  const content = filtered.filter((r) => r.category !== 'faq');
  const showOverview = !q.trim() && !category;

  return (
    <div className="space-y-4">
      <PageHeader title="דע את זכויותיך" icon={<Icon icon={Scale} size={20} />} subtitle="זכויות עבודה, טפסים, מסמכים ושאלות נפוצות לעובדי העירייה" />
      <SearchInput value={q} onChange={setQ} placeholder="חיפוש בזכויות, טפסים ושאלות נפוצות…" ariaLabel="חיפוש בזכויות עובד" />

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {RIGHTS_CATEGORIES.map((c) => {
          const count = rightsByCategory(data.employeeRights, c.id).length;
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => setCategory(active ? '' : c.id)}
                    aria-pressed={active}
                    className={`ripple-lite text-[var(--primary)] rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)] p-3 flex flex-col items-center gap-1 cursor-pointer
                      transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]
                      hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:scale-[0.99]
                      ${active ? 'border-[var(--primary)] bg-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
              <span className="text-2xl" aria-hidden>{c.icon}</span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] text-center">{c.label}</span>
              <Badge tone={count ? 'teal' : 'neutral'}>{count}</Badge>
            </button>
          );
        })}
      </section>

      {showOverview && (
        <Panel title="מסמכים אחרונים" icon={<Icon icon={FileText} size={15} />}>
          {docs.length === 0 ? <Empty text="אין מסמכים עדיין — התוכן ינוהל בפאנל הניהול." /> : (
            <ul className="space-y-1.5">
              {docs.map((d) => (
                <li key={d.id}>
                  <a href={d.documentUrl} target="_blank" rel="noreferrer"
                     className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors">
                    <span className="text-sm text-[var(--text-secondary)]">{d.title}</span>
                    <span className="text-xs text-[var(--text-muted)]">{fmtDate(d.updatedAt)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {showOverview && (
        <Panel title="שאלות נפוצות" icon={<Icon icon={CircleHelp} size={15} />}>
          {faqs.length === 0
            ? <Empty text="עדיין לא נוספו שאלות נפוצות." />
            : <FaqList items={rightsByCategory(data.employeeRights, 'faq').slice(0, 6)} />}
        </Panel>
      )}

      {!showOverview && (
        <Panel title={category ? RIGHTS_CATEGORIES.find((c) => c.id === category)?.label : 'תוצאות חיפוש'} icon={<Icon icon={BookOpen} size={15} />}>
          {category === 'forms' && (
            <div className="mb-3 flex flex-wrap gap-2">
              {data.formDefinitions.filter((f) => isFormActive(f)).map((f) => (
                <button key={f.id} onClick={() => onOpenForm(f.id)}
                        className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">
                  {f.icon} {f.title}
                </button>
              ))}
            </div>
          )}
          {faqs.length > 0 && <div className="mb-3"><FaqList items={faqs} /></div>}
          {content.length === 0 && faqs.length === 0 ? <Empty text="לא נמצא מידע תואם." /> : (
            <div className="space-y-2">
              {content.map((r) => (
                <article key={r.id} className="border-b border-[var(--border)] last:border-0 pb-2.5 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-[var(--text)]">{r.title}</strong>
                    <span className="text-xs text-[var(--text-muted)]">{fmtDate(r.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{r.body}</p>
                  {r.documentUrl && (
                    <a href={r.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline">📎 מסמך מצורף</a>
                  )}
                </article>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function FaqList({ items }: { items: EmployeeRightsItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ul className="space-y-1.5">
      {items.map((f) => {
        const open = openId === f.id;
        return (
          <li key={f.id} className="rounded-[var(--radius-md)] border border-[var(--border)]">
            <button onClick={() => setOpenId((id) => (id === f.id ? null : f.id))}
                    aria-expanded={open}
                    className="w-full text-right px-3 py-2 text-sm font-medium text-[var(--text-secondary)] flex items-center justify-between cursor-pointer">
              {f.title}
              <span aria-hidden className="text-[var(--text-muted)] text-xs">{open ? '▲' : '▼'}</span>
            </button>
            {open && <p className="px-3 pb-2.5 text-xs text-[var(--text-secondary)]">{f.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}
