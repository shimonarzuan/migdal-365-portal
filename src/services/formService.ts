import type { Employee, FormDefinition, FormSubmission } from '@/types';
import { makeEntityService } from './entityService';
import { approvalEngine } from './approvalEngine';
import { formById } from './formsService';

/** הגשות טפסים דיגיטליים (רשימת SharePoint: FormSubmissions) */
export const formSubmissionService = makeEntityService<FormSubmission>('formSubmissions', 'FormSubmissions');

export function mySubmissions(items: FormSubmission[], employeeId: string): FormSubmission[] {
  return items
    .filter((s) => s.employeeId === employeeId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function pendingCount(items: FormSubmission[]): number {
  return items.filter((s) => s.status === 'pending').length;
}

/** ההגשות שממתינות להחלטת המשתמש כמאשר הצעד הנוכחי (Inbox אישורים) */
export function pendingForApprover(
  submissions: FormSubmission[], forms: FormDefinition[], employees: Employee[], userId: string,
): FormSubmission[] {
  return submissions
    .filter((s) => {
      const form = formById(forms, s.formId);
      return form ? approvalEngine.isApprover(userId, s, form, employees) : false;
    })
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}
