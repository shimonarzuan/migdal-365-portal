import { useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Icon, NAV_ICONS, ChevronsLeft } from '@/shared/icons';

export type PageId = 'home' | 'departments' | 'procedures' | 'readsign' | 'contacts' | 'orgtree' | 'systems' | 'reports' | 'admin' | 'rights' | 'reception' | 'forms' | 'learning';

type NavItem = { id: PageId; label: string; adminOnly?: boolean; managers?: boolean };
type NavGroup = { label?: string; items: NavItem[] };

/** ניווט מקובץ בקבוצות לוגיות — בסגנון Microsoft 365 / Viva (אייקוני Lucide) */
const GROUPS: NavGroup[] = [
  { items: [{ id: 'home', label: 'דף הבית' }] },
  {
    label: 'ארגון',
    items: [
      { id: 'departments', label: 'אגפים' },
      { id: 'orgtree', label: 'עץ ארגוני' },
      { id: 'contacts', label: 'אלפון' },
    ],
  },
  {
    label: 'ידע ותהליכים',
    items: [
      { id: 'procedures', label: 'נהלים' },
      { id: 'rights', label: 'זכויות עובד' },
      { id: 'forms', label: 'טפסים' },
      { id: 'readsign', label: 'קרא וחתום' },
      { id: 'learning', label: 'לומדה' },
    ],
  },
  {
    label: 'שירותים',
    items: [
      { id: 'reception', label: 'קבלת קהל' },
      { id: 'systems', label: 'מערכות' },
    ],
  },
  {
    label: 'ניהול',
    items: [
      { id: 'reports', label: 'דוחות', managers: true },
      { id: 'admin', label: 'ניהול', adminOnly: true },
    ],
  },
];

/** מיפוי PageId → תווית, לשימוש ב-breadcrumb וב-Topbar */
export const PAGE_LABELS: Record<PageId, string> = {
  home: 'דף הבית', departments: 'אגפים', orgtree: 'עץ ארגוני', contacts: 'אלפון',
  procedures: 'נהלים', rights: 'זכויות עובד', forms: 'טפסים', readsign: 'קרא וחתום',
  learning: 'לומדה',
  reception: 'קבלת קהל', systems: 'מערכות', reports: 'דוחות', admin: 'ניהול',
};

const COLLAPSE_KEY = 'migdal365.sidebarCollapsed';
const APP_VERSION = '1.0';

/**
 * תפריט צד קבוע בסגנון Microsoft 365 / Viva — ניווט מקובץ בקבוצות.
 * דסקטופ: עמודה בצד ימין (כיווץ לאייקונים-בלבד, נשמר ב-localStorage,
 * עם tooltips במצב סגור) · מובייל: סרגל ניווט תחתון.
 */
export default function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { can, role } = useData();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  const allow = (n: NavItem) =>
    (!n.adminOnly || can('admin.access')) &&
    (!n.managers || can('reports.view') || role.canEdit);

  const groups = GROUPS
    .map((g) => ({ ...g, items: g.items.filter(allow) }))
    .filter((g) => g.items.length > 0);

  // רשימה שטוחה לסרגל המובייל התחתון
  const flat = groups.flatMap((g) => g.items);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const btn = (n: NavItem, mobile: boolean) => {
    const active = page === n.id;
    return (
      <button
        key={n.id}
        onClick={() => onNavigate(n.id)}
        aria-current={active ? 'page' : undefined}
        title={collapsed || mobile ? n.label : undefined}
        className={`group relative flex items-center rounded-[var(--radius-md)] transition-colors duration-[var(--dur-fast)] cursor-pointer
          ${mobile
            ? 'flex-col gap-0.5 flex-1 py-1.5 min-w-0'
            : `gap-3 w-full py-2 ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          ${active
            ? 'bg-[var(--accent)] text-[var(--primary-dark)] font-semibold'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
      >
        {/* פס Accent — קצה החוץ בפריסת RTL, דסקטופ בלבד */}
        {!mobile && (
          <span aria-hidden
            className={`absolute inset-inline-end-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[var(--primary)] origin-center transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)] ${active ? 'scale-y-100' : 'scale-y-0'}`} />
        )}
        <Icon icon={NAV_ICONS[n.id]} size={mobile ? 20 : 18} className={active ? 'text-[var(--primary)]' : ''} />
        {!(collapsed && !mobile) && (
          <span className={`${mobile ? 'text-[10px] text-center w-full' : 'text-[13px] flex-1 text-start'} leading-tight truncate`}>{n.label}</span>
        )}
      </button>
    );
  };

  return (
    <>
      <aside
        className={`hidden md:flex flex-col gap-0.5 py-4 px-2.5 bg-[var(--surface)] border-l border-[var(--border)] sticky top-[64px] h-[calc(100vh-64px)] shrink-0 overflow-y-auto transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out)] ${collapsed ? 'w-[4.5rem]' : 'w-60'}`}
        aria-label="ניווט ראשי"
      >
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {g.label && !collapsed && (
              <span className="px-3 pt-4 pb-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">{g.label}</span>
            )}
            {g.label && collapsed && gi > 0 && <span aria-hidden className="mx-auto my-2 h-px w-7 bg-[var(--border)]" />}
            {g.items.map((n) => btn(n, false))}
          </div>
        ))}

        {/* אזור תמיכה + גרסה */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] flex flex-col gap-1">
          <button onClick={toggleCollapsed} title={collapsed ? 'פתח תפריט' : 'סגור תפריט'} aria-label={collapsed ? 'פתח תפריט' : 'סגור תפריט'}
                  className={`flex items-center gap-3 rounded-[var(--radius-md)] py-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
            <Icon icon={ChevronsLeft} size={18} className={`transition-transform duration-[var(--dur-base)] ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-[13px]">סגור תפריט</span>}
          </button>
          {!collapsed && (
            <span className="px-3 pb-1 text-[10px] text-[var(--text-muted)]">Migdal 365 · גרסה {APP_VERSION}</span>
          )}
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[var(--z-sticky)] bg-[var(--surface)] border-t border-[var(--border)] flex px-1 py-1 pb-[env(safe-area-inset-bottom)] overflow-x-auto"
           aria-label="ניווט ראשי">
        {flat.map((n) => btn(n, true))}
      </nav>
    </>
  );
}
