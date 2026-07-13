import { useData } from '@/shared/DataContext';
import { PageHeader } from '@/shared/ui';
import { Icon, Building2 } from '@/shared/icons';

/** אינדקס אגפים — רשת אייקונים קומפקטית בסגנון אתר העירייה */
export default function Departments({ onOpen }: { onOpen: (deptId: string) => void }) {
  const { data } = useData();

  return (
    <div className="space-y-4">
      <PageHeader title="אגפי העירייה" icon={<Icon icon={Building2} size={20} />}
        subtitle="בחרו אגף לצפייה בנהלים, מסמכים, מערכות, אנשי קשר והודעות." />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {data.departments.map((d) => {
          const procCount = data.procedures.filter((p) => p.deptId === d.id).length;
          return (
            <button key={d.id} onClick={() => onOpen(d.id)}
                    className="ripple-lite text-right bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5 flex items-center gap-3 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-[var(--dur-base)] ease-[var(--ease-out)] cursor-pointer">
              <span className="size-11 shrink-0 grid place-items-center rounded-full bg-[var(--accent)] text-xl" aria-hidden>{d.icon}</span>
              <span className="min-w-0">
                <strong className="block text-sm text-[var(--text)] truncate">{d.name}</strong>
                <small className="text-[11px] text-[var(--primary)]">{procCount > 0 ? `${procCount} נהלים` : 'תוכן בקרוב'}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
