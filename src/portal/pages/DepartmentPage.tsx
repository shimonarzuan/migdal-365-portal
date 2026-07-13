import { useMemo, useState } from 'react';
import type { DeptMeta } from '@/types';
import { useData } from '@/shared/DataContext';
import { Badge, Empty, SearchInput } from '@/shared/ui';

type TabId = 'procedures' | 'documents' | 'links' | 'contacts';

/** DepartmentPortal — עמוד אגפי מלא */
export default function DepartmentPage({ department: d, onBack }: { department: DeptMeta; onBack: () => void }) {
  const { data, canSeeInternal, canEdit, hasSigned, sign } = useData();
  const [tab, setTab] = useState<TabId>('procedures');
  const [q, setQ] = useState('');

  const seeInternal = canSeeInternal(d.id);
  const editable = canEdit(d.id);
  const deptProcs = data.procedures.filter((p) => p.deptId === d.id);
  const deptContacts = data.employees.filter((c) => c.deptId === d.id);
  const deptAnnouncements = data.announcements.filter((a) => a.deptId === d.id);

  const procedures = useMemo(() => deptProcs
    .filter((p) => seeInternal || !p.internal)
    .filter((p) => !q.trim() || p.title.includes(q) || p.description.includes(q)),
  [deptProcs, q, seeInternal]);
  const hiddenCount = deptProcs.filter((p) => p.internal && !seeInternal).length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'procedures', label: `נהלים (${procedures.length})` },
    { id: 'documents', label: `מסמכים (${d.documents.length})` },
    { id: 'links', label: `מערכות (${d.links.length})` },
    { id: 'contacts', label: `אנשי קשר (${deptContacts.length})` },
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="נתיב ניווט">
        <button onClick={onBack} className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] hover:underline cursor-pointer transition-colors">כל האגפים</button>
        <span aria-hidden className="text-[var(--border-strong)] mx-1">‹</span>
        <span className="text-xs text-[var(--text-secondary)] font-medium" aria-current="page">אגף {d.name}</span>
      </nav>

      <header className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 sm:p-5 flex gap-4">
        <span className="size-14 shrink-0 grid place-items-center rounded-[var(--radius-xl)] bg-[var(--accent)] text-3xl" aria-hidden>{d.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-[var(--primary-dark)]">אגף {d.name}</h1>
            {editable && <Badge tone="success">הרשאת עריכה</Badge>}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{d.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-secondary)]">
            {d.managerName && <span>👤 {d.managerName}</span>}
            <a href={`tel:${d.phone}`} className="hover:text-[var(--primary)]">📞 {d.phone}</a>
            <a href={`mailto:${d.contactEmail}`} className="hover:text-[var(--primary)]">✉️ {d.contactEmail}</a>
          </div>
        </div>
      </header>

      {deptAnnouncements.length > 0 && (
        <section className="bg-[var(--warning-bg)] border border-[var(--warning)]/30 rounded-[var(--radius-lg)] px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-[var(--warning-text)]">📣 הודעות אגפיות</h2>
            {editable && <button className="text-[11px] text-[var(--warning-text)] border border-[var(--warning)]/40 rounded px-2 py-1 hover:bg-[var(--warning)]/10 cursor-pointer">+ חדשה</button>}
          </div>
          {deptAnnouncements.map((a) => (
            <div key={a.id} className="py-1.5 border-t border-[var(--warning)]/20 first:border-0 text-sm">
              <div className="flex justify-between gap-2">
                <strong className="text-[var(--text)]">{a.title}</strong>
                <time className="text-[11px] text-[var(--text-muted)] shrink-0">{a.date.slice(5).split('-').reverse().join('/')}</time>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{a.body}</p>
            </div>
          ))}
        </section>
      )}

      <nav className="flex gap-1.5 flex-wrap" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${tab === t.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'procedures' && (
        <div className="space-y-2">
          <SearchInput value={q} onChange={setQ} placeholder="חיפוש נוהל…" ariaLabel="חיפוש נוהל באגף" />
          {procedures.length === 0 && <Empty text="לא נמצאו נהלים." />}
          {procedures.map((p) => (
            <article key={p.id} className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm text-[var(--text)]">{p.title}</strong>
                  {p.internal && <Badge tone="warning">פנימי</Badge>}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.description} · עודכן {p.updatedAt}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button onClick={() => alert(`פתיחת קובץ: ${p.title} (דמו)`)}
                        className="text-xs border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 cursor-pointer">פתח PDF</button>
                {p.requiresReadAndSign && (hasSigned(p.id)
                  ? <Badge tone="success">✓ נחתם</Badge>
                  : <button onClick={() => sign(p.id)} className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">קראתי ואישרתי</button>)}
                {editable && <button className="text-xs border border-dashed border-[var(--border-strong)] text-[var(--text-muted)] rounded-[var(--radius-md)] px-2.5 py-2 cursor-pointer">עריכה</button>}
              </div>
            </article>
          ))}
          {hiddenCount > 0 && <p className="text-xs text-[var(--text-muted)] text-center">🔒 {hiddenCount} נהלים פנימיים זמינים לעובדי האגף בלבד.</p>}
        </div>
      )}

      {tab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {d.documents.length === 0 && <Empty text="אין מסמכים." />}
          {d.documents.map((doc) => (
            <button key={doc.id} onClick={() => alert(`הורדת קובץ: ${doc.title} (דמו)`)}
                    className="text-right bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5 hover:border-[var(--primary)] transition-colors cursor-pointer">
              <Badge tone="teal">{doc.type}</Badge>
              <strong className="block text-sm text-[var(--text)] mt-1.5">{doc.title}</strong>
              <small className="text-xs text-[var(--text-muted)]">{doc.size} · הורדה ⬇</small>
            </button>
          ))}
        </div>
      )}

      {tab === 'links' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {d.links.length === 0 && <Empty text="אין מערכות מקושרות." />}
          {d.links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
               className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5 hover:border-[var(--primary)] transition-colors flex items-center gap-3">
              <span className="text-2xl shrink-0" aria-hidden>{l.icon ?? '🔗'}</span>
              <span className="min-w-0">
                <strong className="block text-sm text-[var(--primary-dark)] truncate">{l.title}</strong>
                <small className="text-[11px] text-[var(--text-muted)] break-all">{l.url}</small>
              </span>
            </a>
          ))}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {deptContacts.length === 0 && <Empty text="אין אנשי קשר." />}
          {deptContacts.map((c) => (
            <div key={c.id} className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-3.5">
              <strong className="block text-sm text-[var(--text)]">{c.name}</strong>
              <span className="text-xs text-[var(--text-muted)]">{c.title}</span>
              <div className="mt-1.5 space-y-0.5 text-xs">
                <a href={`tel:${c.mobile || c.ext}`} className="block text-[var(--primary)] hover:underline">📞 {c.mobile || c.ext}</a>
                <a href={`mailto:${c.email}`} className="block text-[var(--primary)] hover:underline break-all">✉️ {c.email}</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
