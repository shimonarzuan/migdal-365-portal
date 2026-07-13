import { useData } from '@/shared/DataContext';
import { Panel, PageHeader, StatCard } from '@/shared/ui';
import { Icon, Users, Building2, FolderClosed, FileSignature, ListChecks, LayoutGrid, BarChart3, Plug, type LucideIcon } from '@/shared/icons';

/** דוחות למנהלים — מדדים מחושבים מנתוני האמת; יחובר ל-Power BI בהמשך */
export default function ReportsPage() {
  const { data, signatures } = useData();
  const requireSign = data.procedures.filter((p) => p.requiresReadAndSign);
  const totalSigned = requireSign.reduce((n, p) => n + (signatures[p.id]?.length ?? 0), 0);
  const openTasks = data.tasks.filter((t) => !t.done).length;

  const kpis: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: 'עובדים באלפון', value: data.employees.length, icon: Users, color: 'var(--primary)' },
    { label: 'אגפים', value: data.departments.length, icon: Building2, color: '#0e7490' },
    { label: 'נהלים במערכת', value: data.procedures.length, icon: FolderClosed, color: '#946f00' },
    { label: 'חתימות שבוצעו', value: totalSigned, icon: FileSignature, color: '#16a34a' },
    { label: 'משימות פתוחות', value: openTasks, icon: ListChecks, color: '#ea580c' },
    { label: 'מערכות מקושרות', value: data.links.length, icon: LayoutGrid, color: 'var(--primary-dark)' },
  ];

  const byDept = [...data.departments]
    .map((d) => ({ ...d, count: data.employees.filter((e) => e.deptId === d.id).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const max = Math.max(...byDept.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <PageHeader title="דוחות" icon={<Icon icon={BarChart3} size={20} />} subtitle="מדדים מחושבים מנתוני האמת — יחוברו ל-Power BI ולמערכות העירייה בהמשך" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map((k) => (
          <StatCard key={k.label} icon={<Icon icon={k.icon} size={18} />} value={k.value} label={k.label} color={k.color} />
        ))}
      </div>

      <Panel title="עובדים לפי אגף" icon={<Icon icon={BarChart3} size={15} />}>
        <ul className="space-y-1.5">
          {byDept.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <span className="w-40 shrink-0 truncate text-[var(--text-secondary)]">{d.name}</span>
              <div className="flex-1 bg-[var(--surface-sunken)] rounded-full h-4 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--primary)] opacity-85" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="w-8 text-xs font-bold text-[var(--primary-dark)] text-left">{d.count}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="חיבור עתידי" icon={<Icon icon={Plug} size={15} />}>
        <p className="text-sm text-[var(--text-secondary)]">נתוני התחברויות, קריאות שירות ושימוש יתווספו עם חיבור ל-Entra ID, Power BI ומערכות העירייה.</p>
      </Panel>
    </div>
  );
}
