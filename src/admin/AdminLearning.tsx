import { useState } from 'react';
import type { LearningModule, LearningQuizQuestion, LearningContentType, RsAudienceType } from '@/types';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { ROLES } from '@/data/roles';
import { Badge, Btn, Empty, Field, inputCls, Panel } from '@/shared/ui';
import { Icon, GraduationCap, Rocket, Plus, Trash2 } from '@/shared/icons';
import { buildLearningReport } from '@/services/learningService';

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
const fmt = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}` : '—');

const newModule = (createdBy: string): LearningModule => ({
  id: uid('lm'), title: '', description: '', contentType: 'richText', contentBody: '',
  quiz: [], passScore: 80, audienceType: 'all', audienceIds: [], status: 'draft',
  createdBy, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

/**
 * ─── ניהול לומדה — יצירה → קהל יעד → פרסום → דוח השלמה מלא ───
 * הדוח (LearningReport) הוא מקור האמת ל"מי ביצע מה ומתי": כל שורה בטבלה
 * נגזרת מ-LearningCompletion (employeeId + startedAt/completedAt + score).
 */
export default function AdminLearning() {
  const { data, upsert, remove, user, can } = useData();
  const toast = useToast();
  const [editing, setEditing] = useState<LearningModule | null>(null);

  if (!can('learning.manage')) return <Empty text="אין לך הרשאה לניהול לומדה." />;

  const publish = (m: LearningModule) => {
    upsert('learningModules', { ...m, status: 'published', updatedAt: new Date().toISOString() });
    toast.success('המודול פורסם');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--text-secondary)]">תוכן הדרכה עם מבחן אופציונלי ומעקב השלמה מלא (מי + מתי + ציון).</p>
        <Btn small onClick={() => setEditing(newModule(user.id))}><Icon icon={Plus} size={14} /> מודול חדש</Btn>
      </div>

      {data.learningModules.length === 0 && <Empty text="אין עדיין מודולי לומדה. צרו מודול, בחרו קהל ופרסמו." icon={<Icon icon={GraduationCap} size={22} />} />}

      {data.learningModules.map((m) => {
        const report = buildLearningReport(m, data.learningCompletions, data.employees);
        return (
          <Panel key={m.id} title={m.title || '(ללא כותרת)'} icon={<Icon icon={GraduationCap} size={15} />}
                 action={m.status === 'draft'
                   ? <Badge tone="neutral">טיוטה</Badge>
                   : <Badge tone={report.completionPct === 100 ? 'success' : 'warning'}>{report.completionPct}% השלימו</Badge>}>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {m.description} · {m.quiz.length ? `מבחן (${m.quiz.length} שאלות, ציון עובר ${m.passScore}%)` : 'ללא מבחן'} · קהל: {
                m.audienceType === 'all' ? 'כל העובדים'
                : m.audienceType === 'department' ? `אגפים (${m.audienceIds.length})`
                : m.audienceType === 'role' ? `תפקידים (${m.audienceIds.length})`
                : `עובדים ספציפיים (${m.audienceIds.length})`}
            </p>

            {m.status === 'published' && report.assigned.length > 0 && (
              <>
                <div className="h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[var(--success)] transition-all" style={{ width: `${report.completionPct}%` }} />
                </div>
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-right text-[var(--text-muted)] border-b border-[var(--border)]">
                        <th className="py-1.5 pe-3 font-medium">עובד/ת</th>
                        <th className="py-1.5 pe-3 font-medium">התחיל</th>
                        <th className="py-1.5 pe-3 font-medium">הושלם</th>
                        <th className="py-1.5 pe-3 font-medium">ציון</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.completed.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--border)]/60">
                          <td className="py-1.5 pe-3 text-[var(--text)]">{e.name}</td>
                          <td className="py-1.5 pe-3 text-[var(--text-secondary)]">{fmt(e.completion.startedAt)}</td>
                          <td className="py-1.5 pe-3 text-[var(--text-secondary)]">{fmt(e.completion.completedAt ?? '')}</td>
                          <td className="py-1.5 pe-3">
                            {m.quiz.length
                              ? <Badge tone={e.completion.passed ? 'success' : 'danger'}>{e.completion.score}%</Badge>
                              : <Badge tone="success">✓</Badge>}
                          </td>
                        </tr>
                      ))}
                      {report.pending.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--border)]/60">
                          <td className="py-1.5 pe-3 text-[var(--text-muted)]">{e.name}</td>
                          <td className="py-1.5 pe-3 text-[var(--text-muted)]" colSpan={2}>טרם החל</td>
                          <td className="py-1.5 pe-3"><Badge tone="neutral">ממתין</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex gap-2 flex-wrap pt-2 border-t border-[var(--border)]">
              {m.status === 'draft' && <Btn small onClick={() => publish(m)}><Icon icon={Rocket} size={14} /> פרסום</Btn>}
              <Btn small variant="outline" onClick={() => setEditing(m)}>עריכה</Btn>
              <Btn small variant="danger" onClick={() => { if (confirm('למחוק מודול זה?')) remove('learningModules', m.id); }}>מחיקה</Btn>
            </div>
          </Panel>
        );
      })}

      {editing && <ModuleForm module={editing} onClose={() => setEditing(null)}
                              onSave={(m) => { upsert('learningModules', { ...m, updatedAt: new Date().toISOString() }); setEditing(null); toast.success('המודול נשמר'); }} />}
    </div>
  );
}

function ModuleForm({ module: m0, onSave, onClose }: {
  module: LearningModule; onSave: (m: LearningModule) => void; onClose: () => void;
}) {
  const { data } = useData();
  const [draft, setDraft] = useState(m0);
  const set = <K extends keyof LearningModule>(k: K, v: LearningModule[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const audienceOptions: { id: string; label: string }[] =
    draft.audienceType === 'department' ? data.departments.map((d) => ({ id: d.id, label: d.name }))
    : draft.audienceType === 'role' ? Object.values(ROLES).map((r) => ({ id: r.id, label: r.label }))
    : draft.audienceType === 'specific' ? [...data.employees].sort((a, b) => a.name.localeCompare(b.name, 'he')).map((e) => ({ id: e.id, label: e.name }))
    : [];

  const setQuestion = (qi: number, patch: Partial<LearningQuizQuestion>) =>
    set('quiz', draft.quiz.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  const addQuestion = () => set('quiz', [...draft.quiz, { id: uid('q'), question: '', options: ['', ''], correctIndex: 0 }]);
  const removeQuestion = (qi: number) => set('quiz', draft.quiz.filter((_, i) => i !== qi));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); onSave(draft); }}
            className="bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-[var(--primary-dark)]"><Icon icon={GraduationCap} size={17} /> מודול לומדה</h3>
        <Field label="כותרת"><input className={inputCls} required value={draft.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="תיאור"><textarea className={inputCls} rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} /></Field>

        <Field label="סוג תוכן">
          <select className={inputCls} value={draft.contentType} onChange={(e) => set('contentType', e.target.value as LearningContentType)}>
            <option value="richText">טקסט</option>
            <option value="video">סרטון (קישור להטמעה)</option>
            <option value="pdf">מסמך PDF (קישור)</option>
            <option value="link">קישור חיצוני</option>
          </select>
        </Field>
        {draft.contentType === 'richText'
          ? <Field label="תוכן"><textarea className={inputCls} rows={4} value={draft.contentBody ?? ''} onChange={(e) => set('contentBody', e.target.value)} /></Field>
          : <Field label="קישור לתוכן"><input className={inputCls} placeholder="https://…" value={draft.contentUrl ?? ''} onChange={(e) => set('contentUrl', e.target.value)} /></Field>}

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
        <Field label="תאריך יעד (אופציונלי)"><input type="date" className={inputCls} value={draft.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} /></Field>

        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">מבחן ({draft.quiz.length} שאלות)</span>
            <Btn small variant="outline" onClick={addQuestion}><Icon icon={Plus} size={12} /> שאלה</Btn>
          </div>
          {draft.quiz.length > 0 && (
            <Field label="ציון עובר (%)">
              <input type="number" min={0} max={100} className={inputCls} value={draft.passScore}
                     onChange={(e) => set('passScore', Number(e.target.value))} />
            </Field>
          )}
          {draft.quiz.map((q, qi) => (
            <div key={q.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-2.5 space-y-1.5">
              <div className="flex gap-2 items-center">
                <input className={inputCls} placeholder="שאלה" value={q.question} onChange={(e) => setQuestion(qi, { question: e.target.value })} />
                <button type="button" onClick={() => removeQuestion(qi)} className="shrink-0 text-[var(--danger)] cursor-pointer" aria-label="הסרת שאלה"><Icon icon={Trash2} size={14} /></button>
              </div>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oi} onChange={() => setQuestion(qi, { correctIndex: oi })} />
                  <input className={inputCls} placeholder={`אפשרות ${oi + 1}`} value={opt}
                         onChange={(e) => setQuestion(qi, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })} />
                </div>
              ))}
              <button type="button" onClick={() => setQuestion(qi, { options: [...q.options, ''] })} className="text-xs text-[var(--primary-dark)] cursor-pointer">+ אפשרות</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Btn variant="ghost" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">שמירה</Btn>
        </div>
      </form>
    </div>
  );
}
