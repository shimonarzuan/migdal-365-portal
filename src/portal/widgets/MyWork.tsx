import { useData, usePendingSignatures } from '@/shared/DataContext';
import { Panel, Badge } from '@/shared/ui';
import { Icon, ListChecks, FileSignature, Check } from '@/shared/icons';

const fmtDate = (d: string) => d.slice(5).split('-').reverse().join('/');

/** עמודה אמצעית: המשימות שלי · קרא וחתום */
export default function MyWork({ onGoReadSign }: { onGoReadSign: () => void }) {
  const { data, upsert, sign, role, user } = useData();
  const pending = usePendingSignatures();
  const tasks = data.tasks.filter((t) =>
    t.assigneeId === user.id ||
    (!t.assigneeId && !t.deptId) ||
    (!t.assigneeId && t.deptId === user.deptId) ||
    ((role.canEdit || role.allDepartments) && t.deptId === user.deptId),
  );
  const openTasks = tasks.filter((t) => !t.done);

  return (
    <div className="space-y-5">
      <Panel title="המשימות שלי" icon={<Icon icon={ListChecks} size={15} />}
             action={<Badge tone={openTasks.length ? 'warning' : 'success'}>{openTasks.length} פתוחות</Badge>}>
        {tasks.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-1.5 text-center">
            <Icon icon={Check} size={22} className="text-[var(--success)]" />
            <p className="text-xs text-[var(--text-muted)]">אין משימות פתוחות</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id}>
                <label className={`flex items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2 cursor-pointer transition-colors ${t.done ? 'border-[var(--success)]/30 bg-[var(--success-bg)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}>
                  <input type="checkbox" checked={t.done} onChange={() => upsert('tasks', { ...t, done: !t.done })}
                         aria-label={`סמן: ${t.title}`}
                         className="size-4.5 accent-[var(--primary)]" />
                  <span className={`text-sm flex-1 ${t.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>{t.title}</span>
                  <time className="text-[11px] text-[var(--text-muted)] shrink-0">עד {fmtDate(t.due)}</time>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="קרא וחתום" icon={<Icon icon={FileSignature} size={15} />}
             action={
               <span className="flex items-center gap-2">
                 {pending.length > 0
                   ? <span className="text-xs font-bold text-white bg-[var(--danger)] rounded-full size-5 grid place-items-center">{pending.length}</span>
                   : <Badge tone="success">הכול בוצע</Badge>}
                 <button onClick={onGoReadSign} className="text-xs text-[var(--primary)] hover:underline cursor-pointer">לכל המסמכים ←</button>
               </span>
             }>
        {pending.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-1.5 text-center">
            <Icon icon={Check} size={22} className="text-[var(--success)]" />
            <p className="text-xs text-[var(--text-muted)]">אין מסמכים הממתינים לחתימה</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {pending.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2">
                <span className="min-w-0">
                  <strong className="block text-sm text-[var(--text)] truncate">{p.title}</strong>
                  <small className="text-[11px] text-[var(--text-muted)]">{p.dept?.name}</small>
                </span>
                <button onClick={() => sign(p.id)}
                        className="shrink-0 text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">
                  קראתי ואישרתי
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
