import { useEffect, useRef, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { isMsalMode } from '@/services/config';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { Icon, Settings, CircleHelp, LogOut, ChevronDown, ChevronLeft, Phone, Mail } from '@/shared/icons';
import { PAGE_LABELS, type PageId } from './Sidebar';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from '@/portal/widgets/NotificationCenter';

/**
 * Header נקי בסגנון Microsoft 365 / Linear — רקע לבן, Border תחתון עדין,
 * מיתוג + breadcrumb, חיפוש מרכזי, פעולות ופרופיל. אייקוני Lucide בלבד.
 */
export default function Topbar({ onOpenDept, onNavigate, page }: {
  onOpenDept: (id: string) => void;
  onNavigate: (p: PageId) => void;
  page: PageId;
}) {
  const { settings, can } = useData();
  const [logoError, setLogoError] = useState(false);
  const pageLabel = PAGE_LABELS[page];

  return (
    <header className="sticky top-0 z-[var(--z-overlay)] h-16 bg-[var(--surface)] border-b border-[var(--border)]">
      {/* פס מיתוג עליון עדין — עוגן זהות עירונית */}
      <div aria-hidden className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-l from-[var(--primary-dark)] via-[var(--primary)] to-[#2cb5c8]" />
      <div className="h-full max-w-[1400px] mx-auto px-3 sm:px-5 flex items-center gap-3 sm:gap-5">
        {/* אזור מיתוג — לוגו עירוני גדול + זהות מוצר (Co-brand) */}
        <div className="flex items-center gap-3 shrink-0">
          {settings.logoUrl && !logoError
            ? <img src={settings.logoUrl} alt={settings.municipalityName} className="h-9 sm:h-10 w-auto max-w-[150px]"
                   onError={() => setLogoError(true)} />
            : <span className="h-10 px-3 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white grid place-items-center text-base font-extrabold" aria-hidden>מגדל העמק</span>}
          <span aria-hidden className="hidden md:block w-px h-9 bg-[var(--border)]" />
          <div className="hidden md:block leading-tight">
            <strong className="block text-[17px] font-extrabold text-[var(--primary-dark)] tracking-tight">{settings.productName}</strong>
            <span className="block text-[11px] text-[var(--text-muted)]">פורטל עובדים</span>
          </div>
          {page !== 'home' && (
            <div className="hidden lg:flex items-center gap-2 ps-1">
              <Icon icon={ChevronLeft} size={15} className="text-[var(--border-strong)]" />
              <span className="text-sm text-[var(--text-secondary)] font-medium">{pageLabel}</span>
            </div>
          )}
        </div>

        {/* חיפוש מרכזי */}
        <GlobalSearch onOpenDept={onOpenDept} />

        {/* פעולות */}
        <div className="flex items-center gap-1 shrink-0">
          {can('admin.access') && (
            <button onClick={() => onNavigate('admin')} title="הגדרות" aria-label="הגדרות"
                    className="hidden sm:grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer">
              <Icon icon={Settings} size={19} />
            </button>
          )}
          <HelpButton />
          <NotificationCenter onNavigate={onNavigate} />
          <span aria-hidden className="hidden sm:block w-px h-6 bg-[var(--border)] mx-1" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

/** פאנל עזרה — פרטי יצירת קשר אמיתיים של מש"א ומערכות מידע מתוך data.departments */
function HelpButton() {
  const { data } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const contacts = ['hr', 'it']
    .map((id) => data.departments.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <LazyMotion features={domAnimation}>
      <div ref={ref} className="relative shrink-0">
        <button onClick={() => setOpen((v) => !v)} title="עזרה" aria-label="עזרה"
                className="size-9 grid place-items-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer">
          <Icon icon={CircleHelp} size={19} />
        </button>
        <AnimatePresence>
          {open && (
            <m.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
              style={{ transformOrigin: 'top left' }}
              className="absolute top-11 left-0 w-72 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[var(--border)]">
                <span className="text-sm font-semibold text-[var(--text)]">צריכים עזרה?</span>
              </div>
              <div className="p-3 space-y-3">
                {contacts.length === 0 && <p className="text-xs text-[var(--text-muted)] px-1">פרטי יצירת קשר יעודכנו בקרוב.</p>}
                {contacts.map((d) => (
                  <div key={d.id} className="text-xs">
                    <strong className="block text-[var(--text)] mb-1">{d.name}</strong>
                    {d.managerName && <span className="block text-[var(--text-secondary)] mb-1">{d.managerName}</span>}
                    {d.phone && <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-[var(--primary)] hover:underline" dir="ltr"><Icon icon={Phone} size={13} />{d.phone}</a>}
                    {d.contactEmail && <a href={`mailto:${d.contactEmail}`} className="flex items-center gap-1.5 text-[var(--primary)] hover:underline break-all mt-0.5" dir="ltr"><Icon icon={Mail} size={13} />{d.contactEmail}</a>}
                  </div>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

/** תפריט פרופיל — פרטי המשתמש + התנתקות (ייצור) / בורר משתמש (פיתוח) */
function ProfileMenu() {
  const { user, userDept, data, setUserId } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div ref={ref} className="relative shrink-0">
        <button onClick={() => setOpen((v) => !v)} aria-label="תפריט משתמש" aria-expanded={open}
                className="flex items-center gap-2 rounded-[var(--radius-md)] p-1 pe-2 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
          <span className="size-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white grid place-items-center text-xs font-bold">{initials}</span>
          <span className="hidden lg:block text-start leading-tight">
            <span className="block text-[13px] font-semibold text-[var(--text)] max-w-32 truncate">{user.name}</span>
            <span className="block text-[11px] text-[var(--text-muted)] max-w-32 truncate">{user.title || userDept?.name}</span>
          </span>
          <Icon icon={ChevronDown} size={15} className="hidden lg:block text-[var(--text-muted)]" />
        </button>
        <AnimatePresence>
          {open && (
            <m.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
              style={{ transformOrigin: 'top left' }}
              className="absolute top-12 left-0 w-64 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
                <span className="size-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white grid place-items-center text-sm font-bold">{initials}</span>
                <span className="min-w-0">
                  <strong className="block text-sm truncate">{user.name}</strong>
                  <small className="block text-xs text-[var(--text-muted)] truncate">{user.title || userDept?.name}</small>
                  {user.email && <small className="block text-[11px] text-[var(--text-muted)] truncate" dir="ltr">{user.email}</small>}
                </span>
              </div>
              {isMsalMode ? (
                <button onClick={() => import('@/services/authService').then((m) => m.logout())}
                        className="w-full text-right flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--danger-text)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors">
                  <Icon icon={LogOut} size={16} /> התנתקות
                </button>
              ) : (
                <div className="p-3">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">החלפת משתמש (דמו)</label>
                  <select value={user.id} onChange={(e) => { setUserId(e.target.value); setOpen(false); }}
                          aria-label="החלפת משתמש"
                          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs cursor-pointer">
                    {[...data.employees].sort((a, b) => a.name.localeCompare(b.name, 'he')).map((u) => <option key={u.id} value={u.id}>{u.name} — {u.title}</option>)}
                  </select>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
