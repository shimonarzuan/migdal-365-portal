import { useState } from 'react';
import type { ReadAndSignDocument, RsAudienceType } from '@/types';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { ROLES } from '@/data/roles';
import { Badge, Btn, Empty, Field, inputCls, Panel } from '@/shared/ui';
import { Icon, FileSignature, Rocket, Send, Bell, Check } from '@/shared/icons';
import { buildAssignments, buildReminder, buildReport } from '@/services/readAndSignService';

const uid = (p: string) => `${p}-${Date.now().toString(36)}`;
const fmt = (d: string) => d.slice(5).split('-').reverse().join('/');

/**
 * ─── ניהול "קרא וחתום" — Workflow מלא ───
 * יצירה → קהל יעד → תאריך יעד → פרסום → מעקב → תזכורות → דוח.
 */
export default function AdminReadSign() {
  const { data, upsert, remove, user, audit, can } = useData();
  const toast = useToast();
  const [editing, setEditing] = useState<ReadAndSignDocument | null>(null);

  if (!can('readsign.manage')) return <Empty text="אין לך הרשאה לניהול קרא וחתום." />;

  const publish = (doc: ReadAndSignDocument) => {
    const published = { ...doc, status: 'published' as const };
    upsert('rsDocuments', published);
    const assignments = buildAssignments(published, data.employees);
    for (const a of assignments) upsert('rsAssignments', a);
    audit('published', 'rsDocument', doc.id, { status: doc.status }, { status: 'published', assignments: assignments.length });
    toast.success(`המסמך פורסם ל-${assignments.length} עובדים`);
  };

  const remind = (doc: ReadAndSignDocument, pendingCount: number) => {
    const r = buildReminder(doc.id, user.id, pendingCount);
    upsert('rsReminders', r);
    audit('reminderSent', 'rsDocument', doc.id, null, { recipients: pendingCount });
    toast.info(`תזכורת נרשמה ל-${pendingCount} עובדים (שליחה בפועל: SMTP/Teams בשלב הפריסה)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">מסמכים מחייבי חתימה עם קהל יעד, מעקב ותזכורות.</p>
        <Btn small onClick={() => setEditing({
          id: uid('rsd'), title: '', description: '', fileUrl: '', audienceType: 'all', audienceIds: [],
          dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
          status: 'draft', createdBy: user.id, createdAt: new Date().toISOString(),
        })}>+ מסמך חדש</Btn>
      </div>

      {data.rsDocuments.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          אין מסמכי קרא וחתום. צרו מסמך, בחרו קהל יעד ופרסמו.
        </div>
      )}

      {data.rsDocuments.map((doc) => {
        const report = buildReport(doc, data.rsAssignments, data.rsApprovals, data.employees);
        const reminders = data.rsReminders.filter((r) => r.documentId === doc.id);
        return (
          <Panel key={doc.id} title={doc.title || '(ללא כותרת)'} icon={<Icon icon={FileSignature} size={15} />}
                 action={doc.status === 'draft'
                   ? <Badge tone="slate">טיוטה</Badge>
                   : <Badge tone={report.completionPct === 100 ? 'green' : 'amber'}>{report.completionPct}% חתמו</Badge>}>
            <p className="text-xs text-slate-500 mb-2">{doc.description} · יעד: {fmt(doc.dueDate)} · קהל: {
              doc.audienceType === 'all' ? 'כל העובדים'
              : doc.audienceType === 'department' ? `אגפים (${doc.audienceIds.length})`
              : doc.audienceType === 'role' ? `תפקידים (${doc.audienceIds.length})`
              : `עובדים ספציפיים (${doc.audienceIds.length})`}</p>

            {doc.status === 'published' && (
              <>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${report.completionPct}%` }} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--success-text)] mb-1">חתמו ({report.approved.length})</h3>
                    <ul className="space-y-0.5 max-h-32 overflow-y-auto text-xs text-[var(--text-secondary)]">
                      {report.approved.map((e) => <li key={e.id} className="flex items-center gap-1"><Icon icon={Check} size={12} className="text-[var(--success)]" /> {e.name}</li>)}
                      {report.approved.length === 0 && <li className="text-[var(--text-muted)]">אף אחד עדיין.</li>}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--warning-text)] mb-1">טרם חתמו ({report.pending.length})</h3>
                    <ul className="space-y-0.5 max-h-32 overflow-y-auto text-xs text-[var(--text-secondary)]">
                      {report.pending.map((e) => <li key={e.id}>{e.name}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-[var(--border)]">
              {doc.status === 'draft' && <Btn small onClick={() => publish(doc)}><Icon icon={Rocket} size={14} /> פרסום</Btn>}
              {doc.status === 'published' && report.pending.length > 0 && (
                <Btn small variant="outline" onClick={() => remind(doc, report.pending.length)}><Icon icon={Send} size={14} /> תזכורת ({report.pending.length})</Btn>
              )}
              <Btn small variant="outline" onClick={() => setEditing(doc)}>עריכה</Btn>
              <Btn small variant="danger" onClick={() => { if (confirm('למחוק מסמך זה?')) remove('rsDocuments', doc.id); }}>מחיקה</Btn>
              {reminders.length > 0 && <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mr-auto"><Icon icon={Bell} size={12} /> {reminders.length} תזכורות · אחרונה {fmt(reminders[reminders.length - 1].sentAt.slice(0, 10))}</span>}
            </div>
          </Panel>
        );
      })}

      {editing && <DocForm doc={editing} onClose={() => setEditing(null)}
                           onSave={(d) => { upsert('rsDocuments', d); setEditing(null); toast.success('המסמך נשמר'); }} />}
    </div>
  );
}

function DocForm({ doc, onSave, onClose }: { doc: ReadAndSignDocument; onSave: (d: ReadAndSignDocument) => void; onClose: () => void }) {
  const { data } = useData();
  const [draft, setDraft] = useState(doc);
  const set = <K extends keyof ReadAndSignDocument>(k: K, v: ReadAndSignDocument[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const audienceOptions: { id: string; label: string }[] =
    draft.audienceType === 'department' ? data.departments.map((d) => ({ id: d.id, label: d.name }))
    : draft.audienceType === 'role' ? Object.values(ROLES).map((r) => ({ id: r.id, label: r.label }))
    : draft.audienceType === 'specific' ? [...data.employees].sort((a, b) => a.name.localeCompare(b.name, 'he')).map((e) => ({ id: e.id, label: e.name }))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); onSave(draft); }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-[var(--primary-dark)]"><Icon icon={FileSignature} size={17} /> מסמך קרא וחתום</h3>
        <Field label="כותרת"><input className={inputCls} required value={draft.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="תיאור"><textarea className={inputCls} rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="קישור לקובץ (SharePoint)"><input className={inputCls} placeholder="https://…" value={draft.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} /></Field>
        <Field label="קהל יעד">
          <select className={inputCls} value={draft.audienceType}
                  onChange={(e) => { set('audienceType', e.target.value as RsAudienceType); set('audienceIds', []); }}>
            <option value="all">כל העובדים</option>
            <option value="department">לפי אגף</option>
            <option value="role">לפי תפקיד</option>
            <option value="specific">עובדים ספציפיים</option>
          </select>
        </Field>
        {draft.audienceType !== 'all' && (
          <Field label="בחירה (Ctrl לריבוי)">
            <select multiple size={6} className={inputCls}
                    value={draft.audienceIds}
                    onChange={(e) => set('audienceIds', [...e.target.selectedOptions].map((o) => o.value))}>
              {audienceOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="תאריך יעד"><input type="date" className={inputCls} required value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></Field>
        <div className="flex gap-2 justify-end pt-2">
          <Btn variant="ghost" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">שמירה</Btn>
        </div>
      </form>
    </div>
  );
}
