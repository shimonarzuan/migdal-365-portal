import type { Employee, FormAudienceRule, FormDefinition, FormSubmission, MailRecipientRule } from '@/types';
import { makeEntityService, type EntityService } from './entityService';

/**
 * ─── Forms Service — הגדרות טפסים כנתונים ────────────────────────────────────
 * לב מנוע הטפסים: כל טופס הוא שורת FormDefinition שנוצרת/נערכת מפאנל הניהול.
 * ההתמדה דו-מצבית דרך makeEntityService (mock: localStorage · ייצור: רשימת
 * FormDefinitions). כל הפונקציות כאן טהורות — ה-state חי ב-DataContext.
 */

/** הקשר קהל להתאמת כללי הרשאה — entraGroups נטענות רק במצב msal */
export interface AudienceContext {
  employeeId: string;
  deptId: string;
  roleId: string;
  entraGroups: string[];
}

export interface IFormsService extends EntityService<FormDefinition> {}

export const formDefinitionService: IFormsService =
  makeEntityService<FormDefinition>('formDefinitions', 'FormDefinitions');

export function formById(forms: FormDefinition[], id: string): FormDefinition | undefined {
  return forms.find((f) => f.id === id);
}

export function formByProcedure(forms: FormDefinition[], procedureId: string): FormDefinition | undefined {
  return forms.find((f) => f.procedureId === procedureId && f.status === 'published');
}

/** האם הטופס פעיל — מפורסם ובתוך חלון התוקף */
export function isFormActive(form: FormDefinition, now = new Date()): boolean {
  if (form.status !== 'published') return false;
  const iso = now.toISOString().slice(0, 10);
  if (form.validFrom && iso < form.validFrom) return false;
  if (form.validUntil && iso > form.validUntil) return false;
  return true;
}

/** התאמת כללי קהל: רשימה ריקה או 'everyone' = כולם */
export function matchesAudience(rules: FormAudienceRule[], ctx: AudienceContext): boolean {
  if (rules.length === 0) return true;
  return rules.some((r) => {
    switch (r.kind) {
      case 'everyone': return true;
      case 'department': return r.value === ctx.deptId;
      case 'role': return r.value === ctx.roleId;
      case 'employee': return r.value === ctx.employeeId;
      case 'entraGroup': return r.value != null && ctx.entraGroups.includes(r.value);
    }
  });
}

/** הטפסים המוצגים לעובד במסך הטפסים — מפורסמים, בתוקף, ובקהל היעד */
export function publishedFormsFor(forms: FormDefinition[], ctx: AudienceContext, now = new Date()): FormDefinition[] {
  return forms
    .filter((f) => isFormActive(f, now) && matchesAudience(f.permissions.view, ctx))
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

export function canFill(form: FormDefinition, ctx: AudienceContext): boolean {
  return matchesAudience(form.permissions.fill, ctx);
}

export function canViewSubmissions(form: FormDefinition, ctx: AudienceContext, hasManagePermission: boolean): boolean {
  if (form.permissions.viewSubmissions.length > 0) {
    return matchesAudience(form.permissions.viewSubmissions, ctx);
  }
  return hasManagePermission;
}

/** שכפול טופס — עותק חדש בטיוטה */
export function duplicateForm(form: FormDefinition, createdBy: string): FormDefinition {
  const now = new Date().toISOString();
  return {
    ...form,
    id: `form-${Date.now().toString(36)}`,
    title: `${form.title} (עותק)`,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy,
    fields: form.fields.map((f) => ({ ...f })),
    workflow: form.workflow.map((s) => ({ ...s })),
    permissions: {
      view: [...form.permissions.view],
      fill: [...form.permissions.fill],
      viewSubmissions: [...form.permissions.viewSubmissions],
    },
    pdf: { ...form.pdf },
    mail: { steps: form.mail.steps.map((s) => ({ ...s, recipients: s.recipients.map((r) => ({ ...r })) })) },
    archive: { ...form.archive },
    tags: [...form.tags],
  };
}

/**
 * פתרון נמעני מייל להפצת PDF/עדכון לפי הגדרות ה"שליחת מייל" של הטופס.
 * submitter/directManager נגזרים מההגשה עצמה; role/department/employee מהאלפון;
 * entraGroup ייפתר בייצור מול Graph; custom היא כתובת מייל שהוזנה ידנית.
 */
export function resolveMailRecipients(
  rules: MailRecipientRule[], submission: FormSubmission, employees: Employee[],
): string[] {
  const emails = new Set<string>();
  const submitter = employees.find((e) => e.id === submission.employeeId);
  for (const r of rules) {
    switch (r.kind) {
      case 'submitter':
        if (submitter?.email) emails.add(submitter.email);
        break;
      case 'directManager': {
        const manager = submitter?.managerId ? employees.find((e) => e.id === submitter.managerId) : undefined;
        if (manager?.email) emails.add(manager.email);
        break;
      }
      case 'role':
        employees.filter((e) => e.roleId === r.value).forEach((e) => e.email && emails.add(e.email));
        break;
      case 'department':
        employees.filter((e) => e.deptId === r.value).forEach((e) => e.email && emails.add(e.email));
        break;
      case 'employee': {
        const emp = employees.find((e) => e.id === r.value);
        if (emp?.email) emails.add(emp.email);
        break;
      }
      case 'entraGroup':
        break; // ייצור: פתרון חברי קבוצה דרך Microsoft Graph
      case 'custom':
        if (r.value) emails.add(r.value);
        break;
    }
  }
  return [...emails];
}
