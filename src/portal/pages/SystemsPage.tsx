import { useData } from '@/shared/DataContext';
import { PageHeader, Panel, EmptyState } from '@/shared/ui';
import { Icon, LayoutGrid } from '@/shared/icons';

/** מערכות עירוניות + מערכות לפי אגף */
export default function SystemsPage({ onOpenDept }: { onOpenDept: (id: string) => void }) {
  const { data } = useData();
  const deptWithLinks = data.departments.filter((d) => d.links.length > 0);

  return (
    <div className="space-y-4">
      <PageHeader title="מערכות" icon={<Icon icon={LayoutGrid} size={20} />} subtitle="גישה מהירה למערכות העירוניות, Microsoft 365 והמערכות האגפיות" />

      <Panel title="מערכות עירוניות ו-Microsoft 365">
        {data.links.length === 0
          ? <EmptyState title="אין מערכות מוגדרות" description="ניתן להוסיף מערכות דרך פאנל הניהול." icon={<Icon icon={LayoutGrid} size={28} />} />
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {data.links.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                   className="ripple-lite flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] p-3.5 hover:border-[var(--primary)] hover:bg-[var(--accent)] hover:-translate-y-0.5 transition-all duration-[var(--dur-base)] ease-[var(--ease-out)] text-center">
                  <span className="text-3xl" aria-hidden>{s.icon ?? '🔗'}</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{s.title}</span>
                </a>
              ))}
            </div>
          )}
      </Panel>

      {deptWithLinks.length > 0 && (
        <Panel title="מערכות לפי אגף">
          <ul className="space-y-2">
            {deptWithLinks.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-[var(--border)] last:border-0 pb-2 last:pb-0">
                <button onClick={() => onOpenDept(d.id)} className="font-semibold text-[var(--primary-dark)] hover:underline cursor-pointer">{d.icon} {d.name}:</button>
                {d.links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                     className="text-xs bg-[var(--accent)] text-[var(--primary-dark)] rounded-full px-3 py-1.5 hover:bg-[var(--primary)] hover:text-white transition-colors">
                    {l.icon ?? '🔗'} {l.title}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
