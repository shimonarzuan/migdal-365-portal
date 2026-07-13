import { useMemo, useState } from 'react';
import type { Employee } from '@/types';
import { useData } from '@/shared/DataContext';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { PageHeader } from '@/shared/ui';
import { Icon, Network } from '@/shared/icons';
import { deptColor, DEPT_ORDER } from '@/portal/widgets/orgtree/deptColors';
import OrgSearch from '@/portal/widgets/orgtree/OrgSearch';
import TreeNode from '@/portal/widgets/orgtree/TreeNode';
import EmployeeCard from '@/portal/widgets/orgtree/EmployeeCard';

/**
 * ─── העץ הארגוני ─────────────────────────────────────────────────────────────
 * ימין (35%): עץ אינטראקטיבי · שמאל (65%): כרטיס עובד.
 * חיפוש Auto-Complete, פילטרים, צבע ומונה לכל אגף.
 * נתונים: אלפון (פיתוח) / Microsoft Graph (ייצור) — ללא Mock.
 * ביצועים: רינדור Lazy — ענף נטען רק בפתיחתו.
 */

type FilterMode = 'all' | 'managers' | 'staff';
const EXPAND_KEY = 'migdal365.orgtree.expanded';

export default function OrgTreePage({ onOpenEmployee }: { onOpenEmployee: (id: string) => void }) {
  const { data } = useData();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // מצב פתיחה — נשמר גם אחרי בחירת עובד וגם אחרי רענון
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(EXPAND_KEY) ?? '[]')); } catch { return new Set(); }
  });

  const persistExpanded = (next: Set<string>) => {
    sessionStorage.setItem(EXPAND_KEY, JSON.stringify([...next]));
    return next;
  };
  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    return persistExpanded(next);
  });

  // ─── אינדקסים ───
  const { byDept, childrenOf, managerIds, byId } = useMemo(() => {
    const byDept = new Map<string, Employee[]>();
    const children = new Map<string, Employee[]>();
    const byId = new Map<string, Employee>();
    for (const e of data.employees) {
      byId.set(e.id, e);
      byDept.set(e.deptId, [...(byDept.get(e.deptId) ?? []), e]);
      if (e.managerId) children.set(e.managerId, [...(children.get(e.managerId) ?? []), e]);
    }
    return { byDept, childrenOf: (id: string) => children.get(id) ?? [], managerIds: new Set(children.keys()), byId };
  }, [data.employees]);

  const isManager = (e: Employee) => managerIds.has(e.id) || /מנהל/.test(e.title);

  // ─── בחירה מה-Auto-Complete: פתיחת כל שרשרת הניהול של העובד ───
  const jumpToEmployee = (id: string) => {
    const emp = byId.get(id);
    if (!emp) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(emp.deptId);
      let cur = emp.managerId ? byId.get(emp.managerId) : null;
      const seen = new Set<string>();
      while (cur && !seen.has(cur.id)) { seen.add(cur.id); next.add(cur.id); cur = cur.managerId ? byId.get(cur.managerId) : null; }
      return persistExpanded(next);
    });
    setSelectedId(id);
    setDeptFilter('');
    setQ('');
  };

  const jumpToDept = (id: string) => {
    setExpanded((prev) => persistExpanded(new Set(prev).add(id)));
    setDeptFilter(id);
    setQ('');
  };

  // ─── חיפוש + פילטרים ───
  const term = q.trim();
  const matches = (e: Employee, deptName: string) =>
    (!term || e.firstName.includes(term) || e.lastName.includes(term) || e.name.includes(term) || e.title.includes(term) || deptName.includes(term)) &&
    (mode === 'all' || (mode === 'managers' ? isManager(e) : !isManager(e)));

  const departments = useMemo(() => {
    const list = data.departments
      .map((d) => ({ ...d, members: byDept.get(d.id) ?? [] }))
      .filter((d) => d.members.length > 0)
      .filter((d) => !deptFilter || d.id === deptFilter);
    return list.sort((a, b) => {
      const ai = DEPT_ORDER.indexOf(a.id), bi = DEPT_ORDER.indexOf(b.id);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return b.members.length - a.members.length;
    });
  }, [data.departments, byDept, deptFilter]);

  const selected = selectedId ? byId.get(selectedId) : null;

  return (
    <div className="space-y-5">
      {/* ─── כותרת + חיפוש + פילטרים ─── */}
      <header className="space-y-3.5">
        <PageHeader title="העץ הארגוני" icon={<Icon icon={Network} size={20} />} subtitle="מצאו כל עובד בעירייה תוך שניות — לפי שם, תפקיד, אגף או מחלקה." />
        <OrgSearch employees={data.employees} departments={data.departments}
                   value={q} onChange={setQ}
                   onPickEmployee={jumpToEmployee} onPickDept={jumpToDept} />
        <div className="flex gap-2 flex-wrap items-center">
          {([['all', 'הכל'], ['managers', 'רק מנהלים'], ['staff', 'רק עובדים']] as [FilterMode, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-[var(--dur-fast)] cursor-pointer ${mode === m ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-md)]' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)]'}`}>
              {label}
            </button>
          ))}
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} aria-label="סינון לפי אגף"
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text-secondary)] cursor-pointer">
            <option value="">כל האגפים ({data.employees.length})</option>
            {data.departments.filter((d) => (byDept.get(d.id) ?? []).length > 0).map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({(byDept.get(d.id) ?? []).length})</option>
            ))}
          </select>
        </div>
      </header>

      {/* ─── 35% עץ · 65% כרטיס (מובייל: עץ מעל הכרטיס) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[35fr_65fr] gap-5 items-start">

        <section className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5 max-h-[72vh] overflow-y-auto org-scroll"
                 aria-label="עץ ארגוני">
          <LazyMotion features={domAnimation}>
          {departments.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-8">אין תוצאות.</p>}
          {departments.map((dept) => {
            const count = dept.members.filter((e) => matches(e, dept.name)).length;
            if (term && count === 0) return null;
            const isOpen = expanded.has(dept.id) || Boolean(term);
            const color = deptColor(dept.id);
            const memberIdSet = new Set(dept.members.map((m) => m.id));
            const roots = dept.members
              .filter((e) => !e.managerId || !memberIdSet.has(e.managerId))
              .sort((a, b) => childrenOf(b.id).length - childrenOf(a.id).length || a.name.localeCompare(b.name, 'he'));
            return (
              <div key={dept.id} className="mb-1.5">
                <button onClick={() => toggle(dept.id)} aria-expanded={isOpen}
                        className="w-full flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-3 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-sm)] transition-all duration-[var(--dur-fast)] cursor-pointer group">
                  <span className={`text-[var(--border-strong)] text-xs transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''}`} aria-hidden>◂</span>
                  <span className="size-2.5 rounded-full shrink-0 ring-2 ring-white shadow" style={{ background: color }} aria-hidden />
                  <span className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary-dark)]">{dept.icon} {dept.name}</span>
                  <span className="text-[11px] font-medium rounded-full px-2 py-0.5 mr-auto"
                        style={{ background: `${color}18`, color }}>{term ? `${count}/` : ''}{dept.members.length}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <m.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                      className="pr-4 border-r-2 mr-4 mb-2.5 space-y-1" style={{ borderColor: `${color}40` }}
                    >
                      {roots.map((e) => (
                        <TreeNode key={e.id} emp={e} depth={0} color={color}
                                  childrenOf={childrenOf} expanded={expanded} toggle={toggle}
                                  matches={(x) => matches(x, dept.name)} term={term}
                                  selectedId={selectedId} onSelect={setSelectedId} isManager={isManager} />
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          </LazyMotion>
        </section>

        <section className="lg:sticky lg:top-20">
          {selected
            ? <EmployeeCard emp={selected} onSelect={setSelectedId} onOpenEmployee={onOpenEmployee} childrenOf={childrenOf} />
            : <WelcomeCard employeeCount={data.employees.length} deptCount={departments.length} />}
        </section>
      </div>
    </div>
  );
}

function WelcomeCard({ employeeCount, deptCount }: { employeeCount: number; deptCount: number }) {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-12 text-center space-y-3">
      <div className="text-5xl" aria-hidden>🏛️</div>
      <h2 className="text-lg font-bold text-[var(--text)]">המבנה הארגוני של העירייה</h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
        בחרו עובד מהעץ, או הקלידו שם בחיפוש למעלה — ותקבלו כרטיס עם תפקיד,
        מיקום במבנה הארגוני, פרטי קשר, חיוג, מייל ו-Teams בלחיצה אחת.
      </p>
      <div className="flex justify-center gap-8 pt-2 text-sm">
        <div><div className="text-3xl font-extrabold text-[var(--primary)]">{employeeCount}</div><div className="text-xs text-[var(--text-muted)] mt-0.5">עובדים</div></div>
        <div><div className="text-3xl font-extrabold text-[var(--primary)]">{deptCount}</div><div className="text-xs text-[var(--text-muted)] mt-0.5">אגפים</div></div>
      </div>
    </div>
  );
}
