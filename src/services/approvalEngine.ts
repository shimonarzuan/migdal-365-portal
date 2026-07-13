import type { Employee, FormDefinition, FormSubmission, FormSubmissionStep } from '@/types';

/**
 * ─── Approval Engine — מנוע אישורים דינמי ────────────────────────────────────
 * מריץ את מסלול ה-Workflow שהוגדר לטופס (עובד → מנהל ישיר → HR → ... → הושלם).
 * כולו פונקציות טהורות: קלט הגשה+טופס+אלפון, פלט הגשה מעודכנת — ההתמדה
 * נשארת ב-DataContext.upsert. הגשות ישנות ללא steps (מסלול legacy) מוחלטות
 * ישירות ע"י בעלי forms.manage, כמו לפני המנוע.
 */

export interface ApprovalDecision {
  decision: 'approved' | 'rejected';
  decidedBy: string;       // שם תצוגה
  decidedById: string;     // employeeId
  notes?: string;
}

export interface IApprovalEngine {
  buildSteps(form: FormDefinition): FormSubmissionStep[];
  resolveApprovers(stepIndex: number, submission: FormSubmission, form: FormDefinition, employees: Employee[]): Employee[];
  isApprover(userId: string, submission: FormSubmission, form: FormDefinition, employees: Employee[]): boolean;
  applyDecision(submission: FormSubmission, decision: ApprovalDecision): FormSubmission;
}

/** צעדי הגשה התחלתיים מתוך ה-Workflow של הטופס */
function buildSteps(form: FormDefinition): FormSubmissionStep[] {
  return form.workflow.map((s) => ({ stepId: s.id, stepName: s.name, status: 'pending' as const }));
}

/** מי מאשרי צעד נתון — לפי הגדרת הצעד בטופס */
function resolveApprovers(
  stepIndex: number, submission: FormSubmission, form: FormDefinition, employees: Employee[],
): Employee[] {
  const step = form.workflow[stepIndex];
  if (!step) return [];
  switch (step.approverType) {
    case 'directManager': {
      const submitter = employees.find((e) => e.id === submission.employeeId);
      const manager = submitter?.managerId ? employees.find((e) => e.id === submitter.managerId) : undefined;
      return manager ? [manager] : [];
    }
    case 'role': return employees.filter((e) => e.roleId === step.approverValue);
    case 'department': return employees.filter((e) => e.deptId === step.approverValue);
    case 'employee': return employees.filter((e) => e.id === step.approverValue);
    case 'entraGroup': return []; // ייצור: פתרון חברי קבוצה דרך Graph (רשימת חברים אינה באלפון)
  }
}

/** האם המשתמש הוא מאשר הצעד הממתין הנוכחי */
function isApprover(userId: string, submission: FormSubmission, form: FormDefinition, employees: Employee[]): boolean {
  if (submission.status !== 'pending' || !submission.steps?.length) return false;
  const idx = submission.currentStepIndex ?? 0;
  if (submission.steps[idx]?.status !== 'pending') return false;
  return resolveApprovers(idx, submission, form, employees).some((e) => e.id === userId);
}

/** החלת החלטה על הצעד הנוכחי — דחייה עוצרת, אישור אחרון משלים */
function applyDecision(submission: FormSubmission, decision: ApprovalDecision): FormSubmission {
  const now = new Date().toISOString();
  const decidedStep: Pick<FormSubmissionStep, 'status' | 'decidedBy' | 'decidedAt' | 'notes'> = {
    status: decision.decision,
    decidedBy: decision.decidedBy,
    decidedAt: now,
    notes: decision.notes || undefined,
  };

  // מסלול legacy (ללא steps) — החלטה ישירה על ההגשה כולה
  if (!submission.steps?.length) {
    return {
      ...submission,
      status: decision.decision,
      decidedBy: decision.decidedBy,
      decidedAt: now,
      decisionNotes: decision.notes || undefined,
    };
  }

  const idx = submission.currentStepIndex ?? 0;
  const steps = submission.steps.map((s, i) => (i === idx ? { ...s, ...decidedStep } : s));
  const isLast = idx >= steps.length - 1;
  const rejected = decision.decision === 'rejected';
  const finished = rejected || isLast;

  return {
    ...submission,
    steps,
    currentStepIndex: finished ? idx : idx + 1,
    status: finished ? decision.decision : 'pending',
    ...(finished ? { decidedBy: decision.decidedBy, decidedAt: now, decisionNotes: decision.notes || undefined } : {}),
  };
}

export const approvalEngine: IApprovalEngine = { buildSteps, resolveApprovers, isApprover, applyDecision };
