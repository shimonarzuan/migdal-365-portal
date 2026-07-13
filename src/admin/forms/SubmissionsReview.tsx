import { useMemo, useState } from 'react';
import { Button, Textarea } from '@fluentui/react-components';
import { FluentRTL } from '@/shared/fluent';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { Badge, Empty, inputCls } from '@/shared/ui';
import { StepTrail, ValueView } from '@/portal/forms/SubmissionParts';
import { formById, canViewSubmissions, type AudienceContext } from '@/services/formsService';
import { approvalEngine } from '@/services/approvalEngine';
import { createMailService } from '@/services/mailService';
import { onSubmissionDecided, sendConfiguredMail } from '@/services/notificationHooks';
import { pdfService } from '@/services/pdfService';
import type { FormSubmission, FormSubmissionStatus } from '@/types';
import { FINAL_MAIL_STEP_ID } from '@/types';

const fmtDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

const STATUS_META: Record<FormSubmissionStatus, { label: string; tone: 'amber' | 'green' | 'red' }> = {
  pending: { label: 'בטיפול', tone: 'amber' },
  approved: { label: 'אושר', tone: 'green' },
  rejected: { label: 'נדחה', tone: 'red' },
};

/** סקירת הגשות — כולל מסלול הצעדים, החלטה, ו-PDF (Interface) */
export default function SubmissionsReview() {
  const { data, upsert, audit, user, role, can } = useData();
  const toast = useToast();
  const [formFilter, setFormFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const ctx: AudienceContext = useMemo(
    () => ({ employeeId: user.id, deptId: user.deptId, roleId: role.id, entraGroups: [] }),
    [user.id, user.deptId, role.id],
  );
  const manage = can('forms.manage');
  const mail = useMemo(() => createMailService((msg) => upsert('mailQueue', msg)), [upsert]);

  const items = useMemo(() => data.formSubmissions
    .filter((s) => {
      const form = formById(data.formDefinitions, s.formId);
      // הגשות רגישות (viewSubmissions מוגדר) — רק לקהל שהוגדר
      return form ? canViewSubmissions(form, ctx, manage) : manage;
    })
    .filter((s) => !formFilter || s.formId === formFilter)
    .filter((s) => !statusFilter || s.status === statusFilter)
    .sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending') || b.submittedAt.localeCompare(a.submittedAt)),
  [data.formSubmissions, data.formDefinitions, formFilter, statusFilter, ctx, manage]);

  if (!manage) return null;

  const decide = (s: FormSubmission, decision: 'approved' | 'rejected') => {
    const form = formById(data.formDefinitions, s.formId);
    if (!form) return;
    const decidedStepId = s.steps?.[s.currentStepIndex ?? 0]?.stepId ?? FINAL_MAIL_STEP_ID;
    const next = approvalEngine.applyDecision(s, { decision, decidedBy: user.name, decidedById: user.id, notes: notes.trim() });
    upsert('formSubmissions', next);
    audit(decision, 'formSubmission', s.id, { status: s.status, step: s.currentStepIndex }, { status: next.status, step: next.currentStepIndex });
    onSubmissionDecided(mail, form, next, data.employees);
    sendConfiguredMail(mail, form, next, data.employees, next.status !== 'pending' ? FINAL_MAIL_STEP_ID : decidedStepId);
    toast.success(next.status === 'pending' ? 'הצעד אושר — הבקשה עברה לצעד הבא' : decision === 'approved' ? `הבקשה של ${s.employeeName} אושרה` : `הבקשה של ${s.employeeName} נדחתה`);
    setNotes('');
    setOpenId(null);
  };

  const generatePdf = async (s: FormSubmission) => {
    const form = formById(data.formDefinitions, s.formId);
    if (!form) return;
    const result = await pdfService.generateSubmissionPdf({ form, submission: s });
    if (result.status === 'notImplemented') {
      toast.info('יצירת PDF תופעל עם חיבור שירות הרקע (Azure Function) — הממשק מוכן');
    }
  };

  return (
    <FluentRTL>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} className={inputCls + ' sm:w-72'}>
            <option value="">כל הטפסים</option>
            {data.formDefinitions.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' sm:w-40'}>
            <option value="">כל הסטטוסים</option>
            <option value="pending">בטיפול</option>
            <option value="approved">אושר</option>
            <option value="rejected">נדחה</option>
          </select>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <header className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[var(--primary-dark)]">
              🗃️ הגשות <span className="text-slate-400 font-normal">({items.length})</span>
            </h2>
          </header>
          {items.length === 0 && <Empty text="אין הגשות תואמות." />}
          <ul>
            {items.map((s) => {
              const form = formById(data.formDefinitions, s.formId);
              const meta = STATUS_META[s.status];
              const open = openId === s.id;
              const currentStep = s.steps?.[s.currentStepIndex ?? 0];
              return (
                <li key={s.id} className="border-b border-slate-50 last:border-0">
                  <button onClick={() => { setOpenId(open ? null : s.id); setNotes(''); }}
                          className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer flex-wrap">
                    <strong className="text-sm text-slate-800">{form ? `${form.icon} ${form.title}` : s.formId}</strong>
                    <span className="text-xs text-slate-500">{s.employeeName}</span>
                    {s.formVersion != null && <span className="text-[10px] text-slate-400">v{s.formVersion}</span>}
                    {s.status === 'pending' && currentStep && <Badge tone="blue">צעד: {currentStep.stepName}</Badge>}
                    <span className="text-[11px] text-slate-400 mr-auto">הוגש {fmtDate(s.submittedAt)}</span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 space-y-3">
                      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm bg-slate-50 rounded-lg p-3">
                        {form?.fields.filter((f) => !['section', 'divider', 'title'].includes(f.type)).map((f) => (
                          <div key={f.id} className="flex gap-2">
                            <dt className="text-slate-400 text-xs shrink-0 pt-0.5">{f.label}:</dt>
                            <dd className="text-slate-700 text-xs break-all">
                              <ValueView v={s.values[f.id]} isSignature={f.type === 'signature'} />
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <StepTrail s={s} />
                      <div className="flex flex-wrap items-start gap-2">
                        {s.status === 'pending' ? (
                          <div className="flex-1 min-w-60 space-y-2">
                            <Textarea rows={2} resize="vertical" placeholder="הערות להחלטה (יוצגו לעובד/ת)…"
                                      value={notes} onChange={(_, d) => setNotes(d.value)} className="w-full" />
                            <div className="flex gap-2 justify-end">
                              <Button size="small" onClick={() => decide(s, 'rejected')}>❌ דחייה</Button>
                              <Button size="small" appearance="primary" onClick={() => decide(s, 'approved')}>
                                ✅ אישור {currentStep ? `(${currentStep.stepName})` : ''}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 flex-1">
                            הוחלט ע"י {s.decidedBy} ב-{fmtDate(s.decidedAt ?? '')}{s.decisionNotes ? ` · הערות: ${s.decisionNotes}` : ''}
                          </p>
                        )}
                        <Button size="small" appearance="secondary" onClick={() => void generatePdf(s)}>📄 יצירת PDF</Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </FluentRTL>
  );
}
