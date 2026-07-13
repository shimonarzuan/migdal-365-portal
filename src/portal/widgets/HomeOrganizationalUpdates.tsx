import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel, Empty } from '@/shared/ui';
import { Icon, Megaphone, Calendar, UserRound, Info } from '@/shared/icons';
import { activeAnnouncements } from '@/services/announcementService';
import type { AnnouncementPriority } from '@/types';

const fmtDate = (d: string) => (d ? d.slice(5).split('-').reverse().join('/') : '');

const PRIORITY: Record<AnnouncementPriority, { bar: string; label: string; tone: string }> = {
  normal: { bar: 'var(--info)', label: 'מידע', tone: 'var(--info-text)' },
  high: { bar: 'var(--warning)', label: 'חשוב', tone: 'var(--warning-text)' },
  urgent: { bar: 'var(--danger)', label: 'דחוף', tone: 'var(--danger-text)' },
};

/** אזור מידע ארגוני — דבר ראש העיר · הודעות חשובות · אירועים קרובים (5/4/3). */
export default function HomeOrganizationalUpdates() {
  const { settings, data } = useData();
  const [mayorOpen, setMayorOpen] = useState(false);

  const important = useMemo(() =>
    activeAnnouncements(data.announcements)
      .filter((a) => a.kind !== 'news' && a.kind !== 'banner' && a.type !== 'mayor' && a.type !== 'emergency')
      .slice(0, 3),
  [data.announcements]);

  const events = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...data.events].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  }, [data.events]);

  const mayor = settings.mayor;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
      {/* דבר ראש העיר — 5/12 */}
      <section className="md:col-span-2 lg:col-span-5 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] bg-[var(--surface)] border-t-2 border-t-[var(--primary)]">
        <header className="px-4 py-2.5 flex items-center gap-2 border-b border-[var(--border)]" style={{ background: 'color-mix(in srgb, var(--primary) 4%, white)' }}>
          <Icon icon={Megaphone} size={15} className="text-[var(--primary)]" />
          <h2 className="text-sm font-bold text-[var(--primary-dark)]">{mayor.title}</h2>
        </header>
        <div className="p-4">
          {!mayor.body ? <Empty text="אין הודעה מראש העיר כרגע." /> : (
            <div className="flex gap-3">
              <span className="shrink-0 size-11 rounded-full bg-[var(--accent)] text-[var(--primary)] grid place-items-center" aria-hidden><Icon icon={UserRound} size={22} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <strong className="text-sm text-[var(--text)]">{mayor.mayorName}</strong>
                  <time className="text-[11px] text-[var(--text-muted)] shrink-0">{fmtDate(mayor.date)}</time>
                </div>
                <p className={`text-sm text-[var(--text-secondary)] leading-relaxed mt-1 ${mayorOpen ? '' : 'line-clamp-3'}`}>{mayor.body}</p>
                {mayor.body.length > 120 && (
                  <button onClick={() => setMayorOpen((v) => !v)} className="text-xs text-[var(--primary)] hover:underline mt-1.5 cursor-pointer">
                    {mayorOpen ? 'הצג פחות' : 'לקריאה מלאה'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* הודעות חשובות — 4/12 */}
      <div className="lg:col-span-4">
        <Panel title="הודעות חשובות" icon={<Icon icon={Info} size={15} />}>
          {important.length === 0 ? (
            <div className="py-5 flex flex-col items-center gap-1.5 text-center">
              <Icon icon={Info} size={22} className="text-[var(--text-muted)]" />
              <p className="text-xs text-[var(--text-muted)]">אין הודעות חשובות חדשות</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {important.map((a) => {
                const p = PRIORITY[a.priority ?? 'normal'];
                return (
                  <li key={a.id} className="flex gap-2.5">
                    <span aria-hidden className="mt-1 w-1 self-stretch rounded-full shrink-0" style={{ background: p.bar }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <strong className="text-[13px] text-[var(--text)] truncate">{a.title}</strong>
                        <time className="text-[11px] text-[var(--text-muted)] shrink-0">{fmtDate(a.date)}</time>
                      </div>
                      {a.priority && a.priority !== 'normal' && (
                        <span className="text-[11px] font-medium" style={{ color: p.tone }}>{p.label}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* אירועים קרובים — 3/12 */}
      <div className="lg:col-span-3">
        <Panel title="אירועים קרובים" icon={<Icon icon={Calendar} size={15} />}>
          {events.length === 0 ? (
            <div className="py-5 flex flex-col items-center gap-1.5 text-center">
              <Icon icon={Calendar} size={22} className="text-[var(--text-muted)]" />
              <p className="text-xs text-[var(--text-muted)]">אין אירועים קרובים</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5">
                  <span className="shrink-0 grid place-items-center size-9 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary-dark)] leading-none" aria-hidden>
                    <span className="text-sm font-bold">{e.date.slice(8, 10)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[13px] text-[var(--text)] truncate">{e.title}</strong>
                    <small className="text-[11px] text-[var(--text-muted)]">{fmtDate(e.date)}{e.place ? ` · ${e.place}` : ''}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
