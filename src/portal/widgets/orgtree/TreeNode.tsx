import { AnimatePresence, m, motionTokens } from '@/shared/motion';
import type { Employee } from '@/types';

/**
 * צומת עובד בעץ — ריווח נדיב, Hover ברור, סימון בחירה בפס צבע אגפי,
 * ואנימציית פתיחה חלקה. ילדים מרונדרים רק בפתיחה (Lazy).
 */
export default function TreeNode({ emp, depth, color, childrenOf, expanded, toggle, matches, term, selectedId, onSelect, isManager }: {
  emp: Employee;
  depth: number;
  color: string;
  childrenOf: (id: string) => Employee[];
  expanded: Set<string>;
  toggle: (key: string) => void;
  matches: (e: Employee) => boolean;
  term: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isManager: (e: Employee) => boolean;
}) {
  const kids = childrenOf(emp.id).sort((a, b) => childrenOf(b.id).length - childrenOf(a.id).length || a.name.localeCompare(b.name, 'he'));
  const selfMatch = matches(emp);
  const subtreeMatch = selfMatch || kids.some(function deep(k): boolean { return matches(k) || childrenOf(k.id).some(deep); });
  if (term && !subtreeMatch) return null;
  if (!term && !selfMatch && kids.length === 0) return null;

  const isOpen = expanded.has(emp.id) || Boolean(term);
  const isSelected = selectedId === emp.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-xl transition-all duration-150 group
          ${isSelected ? 'bg-[var(--accent)] shadow-sm' : 'hover:bg-slate-50 hover:shadow-sm'}`}
        style={{ marginInlineStart: depth * 16, borderInlineStart: isSelected ? `3px solid ${color}` : '3px solid transparent' }}
      >
        {kids.length > 0 ? (
          <button onClick={() => toggle(emp.id)} aria-expanded={isOpen} aria-label={isOpen ? 'צמצום' : 'הרחבה'}
                  className="size-7 shrink-0 grid place-items-center rounded-lg text-[10px] text-slate-400 hover:bg-white hover:shadow-sm hover:text-[var(--primary)] transition-all cursor-pointer">
            <span className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''}`}>◂</span>
          </button>
        ) : <span className="size-7 shrink-0" />}

        <button onClick={() => onSelect(emp.id)}
                className="flex items-center gap-2.5 min-w-0 flex-1 py-2 pl-2.5 text-right cursor-pointer">
          <span className="size-8 shrink-0 grid place-items-center rounded-full text-[11px] font-bold text-white shadow-sm group-hover:scale-105 transition-transform duration-150"
                style={{ background: isManager(emp) ? color : `${color}99` }}>
            {emp.firstName[0] ?? ''}{emp.lastName[0] ?? ''}
          </span>
          <span className="min-w-0">
            <span className={`block text-sm truncate ${isSelected ? 'font-bold text-[var(--primary-dark)]' : 'text-slate-700'}`}>{emp.name}</span>
            {emp.title && <span className="block text-[11px] text-slate-400 truncate">{emp.title}</span>}
          </span>
          {kids.length > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 shrink-0 mr-auto">{kids.length}</span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
          >
            {kids.map((k) => (
              <TreeNode key={k.id} emp={k} depth={depth + 1} color={color}
                        childrenOf={childrenOf} expanded={expanded} toggle={toggle}
                        matches={matches} term={term} selectedId={selectedId} onSelect={onSelect} isManager={isManager} />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
