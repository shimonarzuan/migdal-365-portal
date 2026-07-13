import { useEffect, useMemo, useRef, useState } from 'react';
import type { Employee, DeptMeta } from '@/types';
import { deptColor } from './deptColors';

/**
 * חיפוש חכם עם Auto-Complete — הצעות בזמן הקלדה:
 * עובדים (שם/משפחה/תפקיד) + אגפים. בחירה קופצת ישירות לעובד ופותחת את הענף.
 */
export default function OrgSearch({ employees, departments, value, onChange, onPickEmployee, onPickDept }: {
  employees: Employee[];
  departments: DeptMeta[];
  value: string;
  onChange: (v: string) => void;
  onPickEmployee: (id: string) => void;
  onPickDept: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const term = value.trim();
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? '';

  const suggestions = useMemo(() => {
    if (term.length < 2) return { emps: [] as Employee[], depts: [] as DeptMeta[] };
    return {
      emps: employees
        .filter((e) => e.firstName.includes(term) || e.lastName.includes(term) || e.name.includes(term) || e.title.includes(term) || deptName(e.deptId).includes(term))
        .slice(0, 6),
      depts: departments.filter((d) => d.name.includes(term)).slice(0, 3),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, employees, departments]);

  const total = suggestions.emps.length + suggestions.depts.length;

  const pick = (i: number) => {
    if (i < suggestions.emps.length) onPickEmployee(suggestions.emps[i].id);
    else onPickDept(suggestions.depts[i - suggestions.emps.length].id);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <input
        type="search" value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || total === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % total); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + total) % total); }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="🔍 חיפוש עובד, תפקיד, אגף או מחלקה…"
        aria-label="חיפוש בעץ הארגוני" aria-expanded={open && total > 0} role="combobox"
        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm focus:outline-2 focus:outline-[var(--primary)] focus:shadow-md transition-shadow"
      />

      {open && term.length >= 2 && total > 0 && (
        <div className="absolute top-full mt-2 inset-x-0 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden z-40 animate-[fadeIn_.12s_ease]"
             role="listbox">
          {suggestions.emps.map((e, i) => (
            <button key={e.id} role="option" aria-selected={active === i}
                    onMouseEnter={() => setActive(i)} onClick={() => pick(i)}
                    className={`w-full text-right flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${active === i ? 'bg-[var(--accent)]' : ''}`}>
              <span className="size-8 shrink-0 grid place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: deptColor(e.deptId) }}>
                {e.firstName[0] ?? ''}{e.lastName[0] ?? ''}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-slate-800 truncate">{e.name}</span>
                <span className="block text-[11px] text-slate-400 truncate">{e.title || '—'} · {deptName(e.deptId)}</span>
              </span>
            </button>
          ))}
          {suggestions.depts.map((d, j) => {
            const i = suggestions.emps.length + j;
            return (
              <button key={d.id} role="option" aria-selected={active === i}
                      onMouseEnter={() => setActive(i)} onClick={() => pick(i)}
                      className={`w-full text-right flex items-center gap-3 px-4 py-2.5 border-t border-slate-50 transition-colors cursor-pointer ${active === i ? 'bg-[var(--accent)]' : ''}`}>
                <span className="size-8 shrink-0 grid place-items-center rounded-full text-base"
                      style={{ background: `${deptColor(d.id)}20` }}>{d.icon}</span>
                <span className="text-sm text-slate-700">אגף {d.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
