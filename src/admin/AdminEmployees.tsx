import { useMemo, useState } from 'react';
import type { Employee, RoleId } from '@/types';
import { useData } from '@/shared/DataContext';
import { ROLES } from '@/data/roles';
import { Badge, Btn, Empty, Field, inputCls, Panel } from '@/shared/ui';
import { Icon, Wrench, ListChecks, Network, ShieldCheck, Check, X } from '@/shared/icons';

const fmtDate = (d: string) => d.slice(5).split('-').reverse().join('/');

/**
 * מסך ניהול עובדים — לכל עובד: דף ניהול משלו עם הרשאות ומשימות.
 * חיפוש → בחירת עובד → פאנל ניהול אישי (הרשאה, פרטים, משימות, דף עובד).
 */
export default function AdminEmployees({ onOpenEmployee }: { onOpenEmployee: (id: string) => void }) {
  const { data, upsert, remove } = useData();
  const [q, setQ] = useState('');
  const [deptId, setDeptId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => data.employees
    .filter((e) => !deptId || e.deptId === deptId)
    .filter((e) => !q.trim() || e.name.includes(q) || e.title.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'he')),
  [data.employees, q, deptId]);

  const selected = selectedId ? data.employees.find((e) => e.id === selectedId) : null;

  return (
    <div className="grid lg:grid-cols-5 gap-4 items-start">
      {/* רשימת עובדים */}
      <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-3 border-b border-slate-100 space-y-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש עובד…" className={inputCls} />
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className={inputCls}>
            <option value="">כל האגפים ({data.employees.length})</option>
            {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <ul className="max-h-[28rem] overflow-y-auto divide-y divide-slate-50">
          {results.length === 0 && <li><Empty text="לא נמצאו עובדים." /></li>}
          {results.map((e) => (
            <li key={e.id}>
              <button onClick={() => setSelectedId(e.id)}
                      className={`w-full text-right px-3.5 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer ${selectedId === e.id ? 'bg-[var(--accent)]' : 'hover:bg-slate-50'}`}>
                <span className="size-8 shrink-0 grid place-items-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--primary-dark)]">
                  {e.firstName[0] ?? ''}{e.lastName[0] ?? ''}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-slate-800 truncate">{e.name}</strong>
                  <small className="block text-[11px] text-slate-400 truncate">{e.title || '—'}</small>
                </span>
                <Badge tone={e.roleId === 'admin' ? 'red' : e.roleId === 'employee' ? 'slate' : 'blue'}>{ROLES[e.roleId].label}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* פאנל ניהול אישי */}
      <div className="lg:col-span-3">
        {selected
          ? <EmployeeAdmin key={selected.id} emp={selected} onOpenEmployee={onOpenEmployee}
                           onSave={(e) => upsert('employees', e)}
                           onDelete={() => { if (confirm(`להסיר את ${selected.name} מהפורטל?`)) { remove('employees', selected.id); setSelectedId(null); } }} />
          : <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
              בחרו עובד מהרשימה כדי לנהל את הדף, ההרשאות והמשימות שלו.
            </div>}
      </div>
    </div>
  );
}

function EmployeeAdmin({ emp, onSave, onDelete, onOpenEmployee }: {
  emp: Employee;
  onSave: (e: Employee) => void;
  onDelete: () => void;
  onOpenEmployee: (id: string) => void;
}) {
  const { data, upsert, remove, directReports } = useData();
  const [draft, setDraft] = useState<Employee>(emp);
  const [newTask, setNewTask] = useState('');
  const [newDue, setNewDue] = useState(new Date().toISOString().slice(0, 10));
  const tasks = data.tasks.filter((t) => t.assigneeId === emp.id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(emp);

  const set = <K extends keyof Employee>(k: K, v: Employee[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-4">
      <Panel title={`ניהול: ${emp.name}`} icon={<Icon icon={Wrench} size={15} />}
             action={<button onClick={() => onOpenEmployee(emp.id)} className="text-xs text-[var(--primary)] hover:underline cursor-pointer">צפייה בדף העובד ←</button>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="שם פרטי"><input className={inputCls} value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
          <Field label="שם משפחה"><input className={inputCls} value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
          <Field label="תפקיד"><input className={inputCls} value={draft.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="אגף">
            <select className={inputCls} value={draft.deptId} onChange={(e) => set('deptId', e.target.value)}>
              {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="נייד"><input className={inputCls} value={draft.mobile} onChange={(e) => set('mobile', e.target.value)} /></Field>
          <Field label="שלוחה"><input className={inputCls} value={draft.ext} onChange={(e) => set('ext', e.target.value)} /></Field>
          <Field label="דוא&quot;ל"><input className={inputCls} value={draft.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="מנהל/ת ישיר/ה">
            <select className={inputCls} value={draft.managerId ?? ''} onChange={(e) => set('managerId', e.target.value || null)}>
              <option value="">— ללא —</option>
              {data.employees.filter((m) => m.id !== emp.id).sort((a, b) => a.name.localeCompare(b.name, 'he'))
                .map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        </div>

        {/* הרשאות */}
        <div className="mt-4">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] mb-1.5"><Icon icon={ShieldCheck} size={14} /> הרשאת מערכת</span>
          <div className="flex gap-1.5 flex-wrap">
            {Object.values(ROLES).map((r) => (
              <button key={r.id} onClick={() => set('roleId', r.id as RoleId)}
                      className={`text-xs rounded-full px-3 py-2 border transition-colors cursor-pointer ${draft.roleId === r.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white border-slate-200 text-slate-600 hover:border-[var(--primary)]'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            ההרשאה קובעת מה העובד רואה ומנהל: נהלים פנימיים, עריכת תוכן אגפי, דוחות ופאנל ניהול.
          </p>
        </div>

        <div className="flex gap-2 justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <Btn small variant="danger" onClick={onDelete}>הסרה מהפורטל</Btn>
          <div className="flex gap-2 items-center">
            {dirty && <span className="text-[11px] text-amber-600">שינויים לא שמורים</span>}
            <Btn small onClick={() => onSave(draft)}><Icon icon={Check} size={14} /> שמירה</Btn>
          </div>
        </div>
      </Panel>

      {/* משימות העובד */}
      <Panel title={`המשימות של ${emp.firstName}`} icon={<Icon icon={ListChecks} size={15} />} action={<Badge tone={tasks.filter((t) => !t.done).length ? 'warning' : 'success'}>{tasks.filter((t) => !t.done).length} פתוחות</Badge>}>
        <form className="flex flex-col sm:flex-row gap-2 mb-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTask.trim()) return;
                upsert('tasks', { id: `t-${Date.now().toString(36)}`, title: newTask.trim(), due: newDue, done: false, assigneeId: emp.id, deptId: emp.deptId });
                setNewTask('');
              }}>
          <input className={inputCls + ' flex-1'} value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="משימה חדשה לעובד…" />
          <input type="date" className={inputCls + ' sm:w-40'} value={newDue} onChange={(e) => setNewDue(e.target.value)} />
          <Btn type="submit" small>+ שיוך משימה</Btn>
        </form>
        {tasks.length === 0 && <Empty text="אין משימות משויכות." />}
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
              <input type="checkbox" checked={t.done} onChange={() => upsert('tasks', { ...t, done: !t.done })} className="size-4.5 accent-[var(--primary)]" />
              <span className={`text-sm flex-1 ${t.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
              <time className="text-[11px] text-slate-400">עד {fmtDate(t.due)}</time>
              <button onClick={() => remove('tasks', t.id)} aria-label="מחיקת משימה"
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"><Icon icon={X} size={14} /></button>
            </li>
          ))}
        </ul>
      </Panel>

      {/* כפיפים */}
      {directReports(emp.id).length > 0 && (
        <Panel title="כפיפים ישירים" icon={<Icon icon={Network} size={15} />} action={<Badge tone="teal">{directReports(emp.id).length}</Badge>}>
          <div className="flex flex-wrap gap-1.5">
            {directReports(emp.id).map((r) => (
              <button key={r.id} onClick={() => onOpenEmployee(r.id)}
                      className="text-xs bg-slate-100 hover:bg-[var(--accent)] rounded-full px-3 py-1.5 text-slate-700 transition-colors cursor-pointer">
                {r.name}
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
