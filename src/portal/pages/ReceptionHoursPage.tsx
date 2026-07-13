import { useEffect, useMemo, useState } from 'react';
import { Badge, Empty, PageHeader, SearchInput, FilterBar, inputCls } from '@/shared/ui';
import { Icon, Clock } from '@/shared/icons';
import { fetchReceptionHours, isOpenNow, MUNICIPALITY_URL, type ReceptionHoursResult } from '@/services/receptionHoursService';
import type { ReceptionHoursEntry } from '@/types';

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const fmtDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

/**
 * קבלת קהל — זמני קבלת קהל, מענה טלפוני ובעלי תפקידים בכל יחידות העירייה,
 * מסודרים לפי אגפים. המקור: אתר העירייה (משיכה חיה → מטמון SharePoint →
 * עותק שמור). ראו receptionHoursService.ts.
 */
export default function ReceptionHoursPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReceptionHoursResult | null>(null);
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');
  const [openNowOnly, setOpenNowOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchReceptionHours()
      .then((r) => { if (alive) setResult(r); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const entries = useMemo(() => (result?.entries ?? [])
    .filter((e) => !q.trim()
      || e.deptName.includes(q)
      || (e.group ?? '').includes(q)
      || (e.contacts ?? []).some((c) => c.name.includes(q) || (c.role ?? '').includes(q)))
    .filter((e) => !day || e.days.includes(day))
    .filter((e) => !openNowOnly || isOpenNow(e)),
  [result, q, day, openNowOnly]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, ReceptionHoursEntry[]>();
    for (const e of entries) {
      const g = e.group ?? 'כללי';
      byGroup.set(g, [...(byGroup.get(g) ?? []), e]);
    }
    return [...byGroup.entries()];
  }, [entries]);

  const sourceBadge = result?.source === 'municipality'
    ? <Badge tone="success">🔄 נטען מאתר העירייה</Badge>
    : result?.source === 'sharepoint'
      ? <Badge tone="success">🔄 מטמון SharePoint</Badge>
      : <Badge tone="teal">📦 מתוך אתר העירייה · עודכן {fmtDate(result?.fetchedAt ?? '')}</Badge>;

  return (
    <div className="space-y-4">
      <PageHeader title="קבלת קהל באגפי העירייה" icon={<Icon icon={Clock} size={20} />}
        subtitle="זמני קבלת קהל, מענה טלפוני ובעלי תפקידים בכל יחידות העירייה"
        actions={
          <span className="flex items-center gap-2">
            {!loading && result?.status === 'ok' && sourceBadge}
            <a href={MUNICIPALITY_URL} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline">אתר העירייה ↗</a>
          </span>
        } />

      {loading && <p className="text-sm text-[var(--text-muted)] py-10 text-center animate-pulse">טוען זמני קבלת קהל…</p>}

      {!loading && result?.status === 'unavailable' && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-8 text-center space-y-3">
          <div className="text-3xl" aria-hidden>⚠️</div>
          <p className="text-sm text-[var(--text-secondary)]">לא ניתן לטעון כעת את זמני קבלת הקהל מאתר העירייה</p>
          <a href={MUNICIPALITY_URL} target="_blank" rel="noreferrer"
             className="inline-block text-sm bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-4 py-2 transition-colors">
            פתח באתר העירייה
          </a>
        </div>
      )}

      {!loading && result?.status === 'ok' && (
        <>
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="חיפוש אגף, מחלקה או בעל/ת תפקיד…" ariaLabel="חיפוש קבלת קהל" />
            <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="סינון לפי יום" className={inputCls + ' sm:w-36'}>
              <option value="">כל הימים</option>
              {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)}
                     className="size-4 accent-[var(--primary)]" />
              🟢 פתוח עכשיו
            </label>
          </FilterBar>

          {entries.length === 0 && <Empty text="אין יחידות תואמות את הסינון." />}

          {groups.map(([group, items]) => (
            <section key={group} className="space-y-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)]">{group} ({items.length})</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {items.map((e) => <EntryCard key={e.id} e={e} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function EntryCard({ e }: { e: ReceptionHoursEntry }) {
  const open = isOpenNow(e);
  return (
    <article className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <strong className="text-sm text-[var(--text)]">{e.deptName}</strong>
        {open ? <Badge tone="success">🟢 פתוח עכשיו</Badge> : e.days.length > 0 ? <Badge tone="neutral">סגור כעת</Badge> : null}
      </div>

      <p className="text-xs text-[var(--text-secondary)]">🕐 {e.hoursText}</p>
      {e.phoneHoursText && <p className="text-xs text-[var(--text-muted)]">☎️ {e.phoneHoursText}</p>}
      {e.notes && <p className="text-xs text-[var(--warning-text)] bg-[var(--warning-bg)] rounded px-2 py-1 inline-block">ℹ️ {e.notes}</p>}

      {(e.contacts?.length ?? 0) > 0 && (
        <ul className="space-y-1 border-t border-[var(--border)] pt-2">
          {e.contacts!.map((c) => (
            <li key={c.name} className="text-xs flex flex-wrap items-baseline gap-x-2">
              <strong className="text-[var(--text-secondary)]">{c.name}</strong>
              {c.role && <span className="text-[var(--text-muted)]">{c.role}</span>}
              {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="text-[var(--primary)] hover:underline" dir="ltr">{c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="text-[var(--primary)] hover:underline truncate" dir="ltr">{c.email}</a>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 text-xs border-t border-[var(--border)]">
        <span className="text-[var(--text-muted)] truncate">
          {e.location && <>📍 {e.location}</>}
          {e.phone && <span className="mr-2 whitespace-nowrap">☎️ <span dir="ltr">{e.phone}</span></span>}
        </span>
        <a href={e.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline shrink-0">מקור ↗</a>
      </div>
    </article>
  );
}
