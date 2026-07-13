import { useData } from '@/shared/DataContext';
import { ROLES } from '@/data/roles';
import { Panel, Badge, Empty } from '@/shared/ui';
import { Icon, Network, ListChecks } from '@/shared/icons';

const fmtDate = (d: string) => d.slice(5).split('-').reverse().join('/');

/** דף עובד — פרופיל אישי: פרטים, מנהל, כפיפים ומשימות */
export default function EmployeePage({ empId, onBack, onOpenEmployee, onOpenDept }: {
  empId: string;
  onBack: () => void;
  onOpenEmployee: (id: string) => void;
  onOpenDept: (id: string) => void;
}) {
  const { data, directReports, upsert, user, isAdmin } = useData();
  const emp = data.employees.find((e) => e.id === empId);
  if (!emp) return <Empty text="עובד לא נמצא." />;

  const dept = data.departments.find((d) => d.id === emp.deptId);
  const manager = emp.managerId ? data.employees.find((e) => e.id === emp.managerId) : null;
  const reports = directReports(emp.id);
  const tasks = data.tasks.filter((t) => t.assigneeId === emp.id);
  const canManageTasks = isAdmin || user.id === emp.managerId;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] hover:underline cursor-pointer transition-colors">‹ חזרה</button>

      {/* כרטיס פרופיל */}
      <header className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 flex flex-col sm:flex-row gap-4">
        <div className="size-16 shrink-0 rounded-full bg-gradient-to-l from-[var(--primary)] to-[var(--sky)] text-white grid place-items-center text-xl font-bold">
          {emp.firstName[0] ?? ''}{emp.lastName[0] ?? ''}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--text)]">{emp.name}</h1>
            <Badge tone="teal">{ROLES[emp.roleId].label}</Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{emp.title || 'ללא הגדרת תפקיד'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm">
            {dept && (
              <button onClick={() => onOpenDept(dept.id)} className="text-[var(--primary)] hover:underline cursor-pointer">
                {dept.icon} אגף {dept.name}
              </button>
            )}
            {emp.mobile && <a href={`tel:${emp.mobile}`} className="text-[var(--text-secondary)] hover:text-[var(--primary)]">📱 {emp.mobile}</a>}
            {emp.ext && <a href={`tel:${emp.ext}`} className="text-[var(--text-secondary)] hover:text-[var(--primary)]">☎️ {emp.ext}</a>}
            {emp.email && <a href={`mailto:${emp.email}`} className="text-[var(--text-secondary)] hover:text-[var(--primary)] break-all">✉️ {emp.email}</a>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* מיקום בארגון */}
        <Panel title="מיקום בעץ הארגוני" icon={<Icon icon={Network} size={15} />}>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-1">מנהל/ת ישיר/ה</span>
              {manager ? (
                <button onClick={() => onOpenEmployee(manager.id)}
                        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 w-full text-right hover:border-[var(--primary)] cursor-pointer">
                  <span className="size-7 grid place-items-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--primary-dark)]">{manager.firstName[0]}{manager.lastName[0]}</span>
                  <span className="min-w-0"><strong className="block text-sm truncate">{manager.name}</strong><small className="text-[11px] text-[var(--text-muted)] truncate block">{manager.title}</small></span>
                </button>
              ) : emp.managerName
                ? <p className="text-[var(--text-secondary)]">{emp.managerName} <span className="text-xs text-[var(--text-muted)]">(לא באלפון)</span></p>
                : <p className="text-[var(--text-muted)] text-xs">ללא מנהל רשום</p>}
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-1">כפיפים ({reports.length})</span>
              {reports.length === 0 && <p className="text-[var(--text-muted)] text-xs">אין כפיפים.</p>}
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                {reports.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => onOpenEmployee(r.id)}
                            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 w-full text-right hover:border-[var(--primary)] cursor-pointer">
                      <span className="size-6 grid place-items-center rounded-full bg-[var(--surface-sunken)] text-[10px] font-bold text-[var(--text-secondary)]">{r.firstName[0]}{r.lastName[0]}</span>
                      <span className="min-w-0 text-sm truncate">{r.name}</span>
                      <small className="text-[11px] text-[var(--text-muted)] truncate mr-auto">{r.title}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        {/* משימות העובד */}
        <Panel title="המשימות של העובד" icon={<Icon icon={ListChecks} size={15} />} className="lg:col-span-2"
               action={canManageTasks ? <Badge tone="neutral">ניהול משימות דרך פאנל הניהול</Badge> : undefined}>
          {tasks.length === 0 && <Empty text="אין משימות משויכות לעובד זה." />}
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2">
                {canManageTasks ? (
                  <input type="checkbox" checked={t.done} onChange={() => upsert('tasks', { ...t, done: !t.done })}
                         aria-label={`סמן משימה: ${t.title}`}
                         className="size-4.5 accent-[var(--primary)]" />
                ) : (
                  <span aria-hidden>{t.done ? '✅' : '⬜'}</span>
                )}
                <span className={`text-sm flex-1 ${t.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>{t.title}</span>
                <time className="text-[11px] text-[var(--text-muted)]">עד {fmtDate(t.due)}</time>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
