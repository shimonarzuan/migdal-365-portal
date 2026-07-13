import { useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel, Badge, Empty } from '@/shared/ui';
import { Icon, Megaphone, Newspaper, Calendar, UserRound, Settings } from '@/shared/icons';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { activeAnnouncements } from '@/services/announcementService';

const fmtDate = (d: string) => d.slice(5).split('-').reverse().join('/');

/** עמודה ימנית: דבר ראש העיר · חדשות · אירועים */
export default function RightColumn() {
  const { settings, data, role } = useData();
  const news = activeAnnouncements(data.announcements.filter((a) => a.kind === 'news')).slice(0, 5);
  const canManage = role.id === 'spokesperson' || role.id === 'admin';
  const [mayorOpen, setMayorOpen] = useState(false);
  const [openNewsId, setOpenNewsId] = useState<string | null>(null);

  return (
    <LazyMotion features={domAnimation}>
    <div className="space-y-5">
      {/* דבר ראש העיר — כרטיס נקי עם פס accent, ללא גרדיאנט */}
      <section className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--surface)] border-t-2 border-t-[var(--primary)]">
        <header className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Icon icon={Megaphone} size={15} className="text-[var(--primary)]" />{settings.mayor.title}
          </h2>
          {canManage && (
            <button className="text-[11px] flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[var(--surface-hover)] cursor-pointer">
              <Icon icon={Settings} size={12} /> ניהול
            </button>
          )}
        </header>
        <div className="p-4 flex gap-3">
          <span className="shrink-0 size-11 rounded-full bg-[var(--accent)] text-[var(--primary)] grid place-items-center" aria-hidden><Icon icon={UserRound} size={22} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <strong className="text-sm text-[var(--text)]">{settings.mayor.mayorName}</strong>
              <time className="text-[11px] text-[var(--text-muted)] shrink-0">{fmtDate(settings.mayor.date)}</time>
            </div>
            <AnimatePresence mode="wait">
              <m.p
                key={mayorOpen ? 'open' : 'closed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                className={`text-sm text-[var(--text-secondary)] leading-relaxed mt-1 ${mayorOpen ? '' : 'line-clamp-4'}`}
              >
                {settings.mayor.body}
              </m.p>
            </AnimatePresence>
            {settings.mayor.body.length > 120 && (
              <button onClick={() => setMayorOpen((v) => !v)} className="text-xs text-[var(--primary)] hover:underline mt-1 cursor-pointer">
                {mayorOpen ? 'הצג פחות' : 'קרא עוד'}
              </button>
            )}
          </div>
        </div>
      </section>

      <Panel title="חדשות העירייה" icon={<Icon icon={Newspaper} size={15} />} action={<Badge tone="teal">{news.length}</Badge>}>
        {news.length === 0 && <Empty text="אין חדשות חדשות." />}
        <ul>
          {news.map((n) => {
            const open = openNewsId === n.id;
            return (
              <li key={n.id} className="border-b border-[var(--border)] last:border-0">
                <button onClick={() => setOpenNewsId(open ? null : n.id)}
                        className="w-full text-right flex items-center gap-2.5 py-2 hover:bg-[var(--surface-hover)] rounded-[var(--radius-md)] px-1.5 -mx-1.5 transition-colors cursor-pointer">
                  <Icon icon={Newspaper} size={15} className="text-[var(--text-muted)] shrink-0" />
                  <strong className="flex-1 min-w-0 text-sm text-[var(--text)] truncate font-medium">{n.title}</strong>
                  <time className="text-[11px] text-[var(--text-muted)] shrink-0">{fmtDate(n.date)}</time>
                </button>
                <AnimatePresence>
                  {open && (
                    <m.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                      className="text-xs text-[var(--text-secondary)] px-1.5 pb-2"
                    >
                      {n.body}
                    </m.p>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="אירועים קרובים" icon={<Icon icon={Calendar} size={15} />}>
        {data.events.length === 0 && <Empty text="אין אירועים מתוכננים." />}
        <ul className="space-y-2.5">
          {data.events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 text-sm">
              <span className="shrink-0 grid place-items-center size-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden><Icon icon={Calendar} size={16} /></span>
              <span className="flex-1 min-w-0">
                <strong className="block text-[var(--text)] text-sm truncate">{e.title}</strong>
                <small className="text-xs text-[var(--text-muted)]">{e.place}</small>
              </span>
              <Badge tone="teal">{fmtDate(e.date)}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
    </LazyMotion>
  );
}
