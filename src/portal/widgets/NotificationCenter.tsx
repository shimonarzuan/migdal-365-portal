import { useEffect, useRef, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { Icon, Bell, ListChecks, FileSignature, Cake, Megaphone, FolderClosed, Calendar, AlertTriangle, ClipboardList, GraduationCap, type LucideIcon } from '@/shared/icons';
import type { PageId } from '@/portal/layout/Sidebar';
import type { NotificationType } from '@/types';

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  task: ListChecks, rsDocument: FileSignature, birthday: Cake, announcement: Megaphone,
  procedure: FolderClosed, event: Calendar, emergency: AlertTriangle, form: ClipboardList,
  learning: GraduationCap,
};

const fmtDate = (d: string) => (d ? d.slice(5, 10).split('-').reverse().join('/') : '');

/** מרכז ההתראות — פעמון + פאנל; המידע נגזר ב-DataContext (deriveNotifications) */
export default function NotificationCenter({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { notifications, unreadNotifCount, markNotificationRead, markAllNotificationsRead } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // רעידת פעמון אוטומטית כשמגיעה התראה חדשה (עלייה במונה בלבד)
  const prevUnread = useRef(unreadNotifCount);
  const [shakeKey, setShakeKey] = useState(0);
  useEffect(() => {
    if (unreadNotifCount > prevUnread.current) setShakeKey((k) => k + 1);
    prevUnread.current = unreadNotifCount;
  }, [unreadNotifCount]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const act = (n: (typeof notifications)[number]) => {
    markNotificationRead(n.id);
    if (n.targetPage) onNavigate(n.targetPage as PageId);
    setOpen(false);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={`התראות (${unreadNotifCount})`}
          className="relative size-9 grid place-items-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <m.span
            key={shakeKey}
            initial={{ rotate: 0 }}
            animate={shakeKey > 0 ? { rotate: [0, -14, 12, -8, 5, 0] } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: motionTokens.ease.out }}
            className="inline-flex"
            aria-hidden
          >
            <Icon icon={Bell} size={19} />
          </m.span>
          <AnimatePresence>
            {unreadNotifCount > 0 && (
              <m.span
                key={unreadNotifCount}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                className="absolute top-0.5 left-0.5 min-w-4 h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold grid place-items-center ring-2 ring-[var(--surface)]"
              >
                {unreadNotifCount}
              </m.span>
            )}
          </AnimatePresence>
        </button>
        <AnimatePresence>
          {open && (
            <m.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
              style={{ transformOrigin: 'top left' }}
              className="absolute top-11 left-0 w-80 bg-[var(--surface)] text-[var(--text)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text)]">התראות</span>
                {unreadNotifCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-[11px] text-[var(--primary)] hover:underline cursor-pointer">סמן הכל כנקרא</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && <p className="p-6 text-sm text-[var(--text-muted)] text-center">אין התראות חדשות</p>}
                {notifications.map((n) => (
                  <button key={n.id} onClick={() => act(n)}
                          className={`w-full text-right flex items-start gap-2.5 px-4 py-2.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors ${n.isRead ? 'opacity-55' : ''}`}>
                    <span className="mt-0.5 shrink-0 grid place-items-center size-7 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden>
                      <Icon icon={TYPE_ICON[n.type]} size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <strong className="text-sm truncate">{n.title}</strong>
                        {!n.isRead && <span className="size-2 rounded-full bg-[var(--primary)] shrink-0" aria-hidden />}
                      </span>
                      <small className="block text-xs text-[var(--text-secondary)] truncate">{n.message}</small>
                      <small className="block text-[11px] text-[var(--text-muted)]">{fmtDate(n.createdAt)}</small>
                    </span>
                  </button>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
