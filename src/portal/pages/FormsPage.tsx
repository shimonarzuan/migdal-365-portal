import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { Badge, Empty, Panel, PageHeader } from '@/shared/ui';
import { Icon, ClipboardList, Bell, Inbox } from '@/shared/icons';
import FormRenderer from '@/portal/forms/FormRenderer';
import { StepTrail, ValueView } from '@/portal/forms/SubmissionParts';
import { formById, publishedFormsFor, canFill, type AudienceContext } from '@/services/formsService';
import { mySubmissions, pendingForApprover } from '@/services/formService';
import { approvalEngine } from '@/services/approvalEngine';
import { createMailService } from '@/services/mailService';
import { onSubmissionCreated, onSubmissionDecided, sendConfiguredMail } from '@/services/notificationHooks';
import type { FormDefinition, FormSubmission, FormSubmissionStatus, FormValue } from '@/types';
import { FINAL_MAIL_STEP_ID } from '@/types';

const fmtDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

const STATUS_META: Record<FormSubmissionStatus, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: '⏳ בטיפול', tone: 'warning' },
  approved: { label: '✅ אושר', tone: 'success' },
  rejected: { label: '❌ נדחה', tone: 'danger' },
};

/**
 * מסך הטפסים של העובד — מונע כולו ממנוע הטפסים: כל FormDefinition שפורסם
 * בפאנל הניהול מופיע כאן אוטומטית (ללא שינוי קוד), מקובץ לפי קטגוריה.
 * כולל Inbox "ממתינים לאישורך" למאשרי צעדי Workflow.
 */
export default function FormsPage({ initialFormId }: { initialFormId?: string | null }) {
  const { data, user, role, upsert, audit } = useData();
  const toast = useToast();
  const [openFormId, setOpenFormId] = useState<string | null>(initialFormId ?? null);

  const ctx: AudienceContext = useMemo(
    () => ({ employeeId: user.id, deptId: user.deptId, roleId: role.id, entraGroups: [] }),
    [user.id, user.deptId, role.id],
  );

  const visibleForms = useMemo(() => publishedFormsFor(data.formDefinitions, ctx), [data.formDefinitions, ctx]);
  const byCategory = useMemo(() => {
    const m = new Map<string, FormDefinition[]>();
    for (const f of visibleForms) m.set(f.category, [...(m.get(f.category) ?? []), f]);
    return [...m.entries()];
  }, [visibleForms]);

  const submissions = useMemo(() => mySubmissions(data.formSubmissions, user.id), [data.formSubmissions, user.id]);
  const approvalsInbox = useMemo(
    () => pendingForApprover(data.formSubmissions, data.formDefinitions, data.employees, user.id),
    [data.formSubmissions, data.formDefinitions, data.employees, user.id],
  );

  const mail = useMemo(() => createMailService((msg) => upsert('mailQueue', msg)), [upsert]);
  const openForm = openFormId ? formById(data.formDefinitions, openFormId) : undefined;

  const submitForm = (form: FormDefinition, values: Record<string, FormValue>) => {
    const steps = approvalEngine.buildSteps(form);
    const submission: FormSubmission = {
      id: `fs-${Date.now().toString(36)}`,
      formId: form.id,
      formVersion: form.version,
      employeeId: user.id,
      employeeName: user.name,
      values,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...(steps.length > 0 ? { steps, currentStepIndex: 0 } : {}),
    };
    upsert('formSubmissions', submission);
    audit('submitted', 'formSubmission', submission.id, null, { formId: form.id, version: form.version });
    onSubmissionCreated(mail, form, submission, data.employees);
    toast.success('הטופס נשלח בהצלחה — הבקשה נכנסה למסלול הטיפול');
    setOpenFormId(null);
  };

  const decideStep = (s: FormSubmission, decision: 'approved' | 'rejected', notes: string) => {
    const form = formById(data.formDefinitions, s.formId);
    if (!form) return;
    const decidedStepId = s.steps?.[s.currentStepIndex ?? 0]?.stepId ?? FINAL_MAIL_STEP_ID;
    const next = approvalEngine.applyDecision(s, { decision, decidedBy: user.name, decidedById: user.id, notes });
    upsert('formSubmissions', next);
    audit(decision, 'formSubmission', s.id, { step: s.currentStepIndex }, { step: next.currentStepIndex, status: next.status });
    onSubmissionDecided(mail, form, next, data.employees);
    sendConfiguredMail(mail, form, next, data.employees, next.status !== 'pending' ? FINAL_MAIL_STEP_ID : decidedStepId);
    toast.success(decision === 'approved' ? 'הצעד אושר' : 'הבקשה נדחתה');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="טפסים דיגיטליים" icon={<Icon icon={ClipboardList} size={20} />}
        subtitle={`ההגשה מזוהה באמצעות חשבונך (${user.name}) — אין צורך בחתימה ידנית. טפסים חדשים מתפרסמים ממערכת ניהול הטפסים.`} />

      {approvalsInbox.length > 0 && !openForm && (
        <Panel title={`ממתינים לאישורך (${approvalsInbox.length})`} icon={<Icon icon={Bell} size={15} />}>
          <ul className="space-y-2">
            {approvalsInbox.map((s) => (
              <ApprovalRow key={s.id} s={s} form={formById(data.formDefinitions, s.formId)} onDecide={decideStep} />
            ))}
          </ul>
        </Panel>
      )}

      {openForm ? (
        canFill(openForm, ctx) ? (
          <FormRenderer form={openForm} onCancel={() => setOpenFormId(null)}
                        onSubmit={(values) => submitForm(openForm, values)} />
        ) : (
          <Empty text="אין לך הרשאה למלא טופס זה." />
        )
      ) : (
        <>
          {visibleForms.length === 0 && <Empty text="אין טפסים מפורסמים כרגע." />}
          {byCategory.map(([category, forms]) => (
            <section key={category} className="space-y-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)]">{category} ({forms.length})</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {forms.map((f) => <FormCard key={f.id} f={f} deptName={data.departments.find((d) => d.id === f.deptId)?.name}
                                            procTitle={f.procedureId ? data.procedures.find((p) => p.id === f.procedureId)?.title : undefined}
                                            onOpen={() => setOpenFormId(f.id)} />)}
              </div>
            </section>
          ))}
        </>
      )}

      <Panel title="הבקשות שלי" icon={<Icon icon={Inbox} size={15} />}>
        {submissions.length === 0 && <Empty text="טרם הגשת טפסים. בקשות שתגיש יופיעו כאן עם סטטוס הטיפול." />}
        <ul className="space-y-2">
          {submissions.map((s) => <SubmissionRow key={s.id} s={s} form={formById(data.formDefinitions, s.formId)} />)}
        </ul>
      </Panel>
    </div>
  );
}

function FormCard({ f, deptName, procTitle, onOpen }: {
  f: FormDefinition; deptName?: string; procTitle?: string; onOpen: () => void;
}) {
  return (
    <article className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 flex flex-col gap-2 border-t-4
                         transition-all duration-[var(--dur-base)] ease-[var(--ease-out)]
                         hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5
                         hover:shadow-[0_8px_20px_-8px_var(--primary)]"
             style={{ borderTopColor: f.color ?? 'var(--primary)' }}>
      <div className="flex items-start justify-between gap-2">
        <strong className="text-sm text-[var(--text)]">{f.icon} {f.title}</strong>
        {deptName && <Badge tone="neutral">{deptName}</Badge>}
      </div>
      <p className="text-xs text-[var(--text-secondary)] flex-1">{f.description}</p>
      {f.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {f.tags.map((t) => <span key={t} className="text-[10px] bg-[var(--surface-sunken)] text-[var(--text-muted)] rounded-full px-2 py-0.5">#{t}</span>)}
        </div>
      )}
      {procTitle && <span className="text-[11px] text-[var(--text-muted)]">🗂️ מקור: {procTitle}</span>}
      <button onClick={onOpen}
              className="ripple-lite text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] hover:scale-[1.02] active:scale-[0.98] text-white rounded-[var(--radius-md)] px-3 py-2 transition-all duration-[var(--dur-fast)] cursor-pointer">
        מילוי הטופס
      </button>
    </article>
  );
}

function SubmissionRow({ s, form }: { s: FormSubmission; form?: FormDefinition }) {
  const meta = STATUS_META[s.status];
  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <strong className="text-sm text-[var(--text)]">{form ? `${form.icon} ${form.title}` : s.formId}</strong>
        <span className="flex items-center gap-2">
          <time className="text-[11px] text-[var(--text-muted)]">הוגש {fmtDate(s.submittedAt)}</time>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </span>
      </div>
      <StepTrail s={s} />
      {s.status !== 'pending' && (
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          הוחלט ע"י {s.decidedBy} ב-{fmtDate(s.decidedAt ?? '')}{s.decisionNotes ? ` · ${s.decisionNotes}` : ''}
        </p>
      )}
    </li>
  );
}

/** שורת אישור ב-Inbox של מאשר — פרטי ההגשה + החלטה */
function ApprovalRow({ s, form, onDecide }: {
  s: FormSubmission;
  form?: FormDefinition;
  onDecide: (s: FormSubmission, decision: 'approved' | 'rejected', notes: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  if (!form) return null;
  const stepName = s.steps?.[s.currentStepIndex ?? 0]?.stepName ?? '';
  return (
    <li className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-bg)]/40 px-3 py-2.5">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full text-right flex items-center justify-between gap-2 flex-wrap cursor-pointer">
        <span className="text-sm">
          <strong className="text-[var(--text)]">{form.icon} {form.title}</strong>
          <span className="text-[var(--text-secondary)]"> · {s.employeeName}</span>
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="warning">צעד: {stepName}</Badge>
          <time className="text-[11px] text-[var(--text-muted)]">{fmtDate(s.submittedAt)}</time>
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs bg-[var(--surface)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
            {form.fields.filter((f) => !['section', 'divider', 'title'].includes(f.type)).map((f) => (
              <div key={f.id} className="flex gap-1.5">
                <dt className="text-[var(--text-muted)] shrink-0">{f.label}:</dt>
                <dd className="text-[var(--text-secondary)] break-all"><ValueView v={s.values[f.id]} isSignature={f.type === 'signature'} /></dd>
              </div>
            ))}
          </dl>
          <StepTrail s={s} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    placeholder="הערות להחלטה (יוצגו לעובד/ת)…"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:outline-2 focus:outline-[var(--primary)]" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => onDecide(s, 'rejected', notes)}
                    className="text-xs bg-[var(--danger)] hover:brightness-95 text-white rounded-[var(--radius-md)] px-3 py-2 cursor-pointer">❌ דחייה</button>
            <button onClick={() => onDecide(s, 'approved', notes)}
                    className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 cursor-pointer">✅ אישור</button>
          </div>
        </div>
      )}
    </li>
  );
}
