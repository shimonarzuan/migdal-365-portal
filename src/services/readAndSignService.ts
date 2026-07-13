import type {
  Employee, ReadAndSignDocument, ReadAndSignAssignment, ReadAndSignApproval, ReadAndSignReminder,
} from '@/types';
import { isMsalMode } from './config';
import { makeEntityService } from './entityService';
import { logger } from './logger';

/**
 * ─── readAndSignService — Workflow מלא ל"קרא וחתום" ─────────────────────────
 * יצירה (HR/IT) → קהל יעד → תאריך יעד → פרסום → הקצאות לעובדים →
 * אישור עובד → מעקב מנהל → תזכורות → דוח חתימות.
 * mock: localStorage · production: רשימות SharePoint (ראו docs/sharepoint-schema.md).
 */

export const rsDocumentService = makeEntityService<ReadAndSignDocument>('rsDocuments', 'ReadAndSignDocuments');
export const rsAssignmentService = makeEntityService<ReadAndSignAssignment>('rsAssignments', 'ReadAndSignAssignments');
export const rsApprovalService = makeEntityService<ReadAndSignApproval>('rsApprovals', 'ReadAndSignApprovals');
export const rsReminderService = makeEntityService<ReadAndSignReminder>('rsReminders', 'ReadAndSignReminders');

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

/** חישוב קהל היעד של מסמך → רשימת עובדים */
export function resolveAudience(doc: ReadAndSignDocument, employees: Employee[]): Employee[] {
  switch (doc.audienceType) {
    case 'all': return employees;
    case 'department': return employees.filter((e) => doc.audienceIds.includes(e.deptId));
    case 'role': return employees.filter((e) => doc.audienceIds.includes(e.roleId));
    case 'specific': return employees.filter((e) => doc.audienceIds.includes(e.id));
  }
}

/** פרסום מסמך: יצירת הקצאות (Assignments) לכל קהל היעד */
export function buildAssignments(doc: ReadAndSignDocument, employees: Employee[]): ReadAndSignAssignment[] {
  return resolveAudience(doc, employees).map((e) => ({
    id: uid('rsa'),
    documentId: doc.id,
    employeeId: e.id,
    assignedAt: new Date().toISOString(),
    dueDate: doc.dueDate,
  }));
}

/** אישור "קראתי ואישרתי" של עובד */
export function buildApproval(documentId: string, employeeId: string): ReadAndSignApproval {
  return { id: uid('rsap'), documentId, employeeId, approvedAt: new Date().toISOString() };
}

/** רישום תזכורת (בייצור: שליחה בפועל דרך SMTP/Teams בצד שרת) */
export function buildReminder(documentId: string, sentBy: string, recipientCount: number): ReadAndSignReminder {
  if (isMsalMode) {
    logger.info(`readAndSign: תזכורת למסמך ${documentId} — שליחה בפועל תבוצע דרך רכיב השרת (SMTP/Teams)`);
  }
  return { id: uid('rsr'), documentId, sentAt: new Date().toISOString(), sentBy, recipientCount };
}

/** דוח חתימות למסמך */
export interface RsReport {
  document: ReadAndSignDocument;
  assigned: Employee[];
  approved: Employee[];
  pending: Employee[];
  completionPct: number;
}

export function buildReport(
  doc: ReadAndSignDocument,
  assignments: ReadAndSignAssignment[],
  approvals: ReadAndSignApproval[],
  employees: Employee[],
): RsReport {
  const assignedIds = assignments.filter((a) => a.documentId === doc.id).map((a) => a.employeeId);
  const approvedIds = new Set(approvals.filter((a) => a.documentId === doc.id).map((a) => a.employeeId));
  const assigned = employees.filter((e) => assignedIds.includes(e.id));
  const approved = assigned.filter((e) => approvedIds.has(e.id));
  const pending = assigned.filter((e) => !approvedIds.has(e.id));
  return {
    document: doc,
    assigned,
    approved,
    pending,
    completionPct: assigned.length ? Math.round((approved.length / assigned.length) * 100) : 0,
  };
}
