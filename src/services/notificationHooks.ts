import type { Employee, FormDefinition, FormSubmission } from '@/types';
import { FINAL_MAIL_STEP_ID } from '@/types';
import { approvalEngine } from './approvalEngine';
import { resolveMailRecipients } from './formsService';
import type { IMailService } from './mailService';

/**
 * ─── Notification Hooks — אירועי מנוע הטפסים → תור המייל ────────────────────
 * שתי שכבות נפרדות:
 * 1. onSubmissionCreated/onSubmissionDecided — עדכוני מערכת קבועים (מגיש+מאשרים).
 * 2. sendConfiguredMail — הפצת PDF/עדכון לפי לשונית "שליחת מייל" של הטופס
 *    (form.mail.steps), לכל שלב שהוגדר עבורו נמענים או בסיום (FINAL_MAIL_STEP_ID).
 * ההתראות בתוך הפורטל נגזרות בנפרד (notificationService) — כאן רק דוא"ל.
 */

function emailsOf(employees: Employee[]): string[] {
  return employees.map((e) => e.email).filter(Boolean);
}

/** הגשה חדשה — מיידע את מאשרי הצעד הראשון (או את בעלי התפקיד המנהלים במסלול legacy) */
export function onSubmissionCreated(
  mail: IMailService, form: FormDefinition, submission: FormSubmission, employees: Employee[],
): void {
  const approvers = submission.steps?.length
    ? approvalEngine.resolveApprovers(0, submission, form, employees)
    : [];
  if (approvers.length === 0) return; // מסלול legacy/קבוצת Entra — הטיפול בפאנל הניהול
  mail.queue({
    to: emailsOf(approvers),
    subject: `📋 טופס ממתין לאישורך: ${form.title}`,
    body: `${submission.employeeName} הגיש/ה "${form.title}" וממתין/ה לאישורך בצעד "${submission.steps![0].stepName}". לצפייה: פורטל העובדים ← טפסים.`,
    relatedType: 'formSubmission',
    relatedId: submission.id,
  });
}

/** אחרי החלטה על צעד — מיידע את המגיש בסיום, או את מאשרי הצעד הבא בהמשך המסלול */
export function onSubmissionDecided(
  mail: IMailService, form: FormDefinition, submission: FormSubmission, employees: Employee[],
): void {
  const submitter = employees.find((e) => e.id === submission.employeeId);

  if (submission.status !== 'pending') {
    if (submitter?.email) {
      mail.queue({
        to: [submitter.email],
        subject: submission.status === 'approved' ? `✅ הבקשה אושרה: ${form.title}` : `❌ הבקשה נדחתה: ${form.title}`,
        body: `הבקשה שלך "${form.title}" ${submission.status === 'approved' ? 'אושרה' : 'נדחתה'}${submission.decisionNotes ? ` · הערות: ${submission.decisionNotes}` : ''}.`,
        relatedType: 'formSubmission',
        relatedId: submission.id,
      });
    }
    return;
  }

  // המסלול ממשיך — התראה למאשרי הצעד הבא
  const idx = submission.currentStepIndex ?? 0;
  const next = approvalEngine.resolveApprovers(idx, submission, form, employees);
  if (next.length > 0) {
    mail.queue({
      to: emailsOf(next),
      subject: `📋 טופס ממתין לאישורך: ${form.title}`,
      body: `הבקשה של ${submission.employeeName} ("${form.title}") עברה לצעד "${submission.steps?.[idx]?.stepName ?? ''}" וממתינה לאישורך.`,
      relatedType: 'formSubmission',
      relatedId: submission.id,
    });
  }
}

/**
 * הפצת מייל מוגדרת — לפי form.mail.steps, לצעד שהוכרע זה עתה (stepId) או לבסיום
 * (FINAL_MAIL_STEP_ID). זוהי לשונית "שליחת מייל" בעורך הטופס — נפרדת מהתראות
 * המערכת הקבועות למעלה, ומיועדת להפצת עותקי PDF/עדכון לגורמים מוגדרים מראש.
 */
export function sendConfiguredMail(
  mail: IMailService, form: FormDefinition, submission: FormSubmission, employees: Employee[], stepId: string,
): void {
  const setting = form.mail.steps.find((s) => s.stepId === stepId);
  if (!setting || setting.recipients.length === 0) return;
  const to = resolveMailRecipients(setting.recipients, submission, employees);
  if (to.length === 0) return;
  const stepLabel = stepId === FINAL_MAIL_STEP_ID
    ? 'בסיום התהליך'
    : (submission.steps?.find((s) => s.stepId === stepId)?.stepName ?? stepId);
  mail.queue({
    to,
    subject: `📄 ${form.title} — עדכון (${stepLabel})`,
    body: `הבקשה של ${submission.employeeName} ("${form.title}") הגיעה לשלב "${stepLabel}".`
      + (setting.attachPdf ? ' קובץ ה-PDF יצורף ע"י שירות הרקע (בהקמה).' : ''),
    relatedType: 'formSubmission',
    relatedId: submission.id,
  });
}
