import type { RoleId } from '@/types';

/**
 * ─── מיפוי קבוצות Entra ID → תפקידי פורטל ───────────────────────────────────
 * ההרשאות בייצור נקבעות לפי חברות בקבוצות (Graph /me/memberOf).
 * ההתאמה לפי שם הקבוצה (displayName) — הקבוצות הקיימות ב-Tenant של העירייה.
 * ניתן להוסיף groupId (Object ID) להתאמה קשיחה יותר.
 *
 * סדר = עדיפות: מי שחבר בכמה קבוצות מקבל את התפקיד הראשון שנמצא.
 */
export const ENTRA_GROUP_TO_ROLE: { groupName: string; groupId?: string; role: RoleId }[] = [
  { groupName: 'MH-M365-Admins',             role: 'admin' },
  { groupName: 'MH-M365-IT',                 role: 'it' },
  { groupName: 'MH-M365-HR',                 role: 'hr' },
  { groupName: 'MH-M365-Spokesperson',       role: 'spokesperson' },
  { groupName: 'MH-M365-Mayor',              role: 'spokesperson' }, // לשכת ראש העיר — ניהול הודעות
  { groupName: 'MH-M365-CEO',                role: 'spokesperson' }, // לשכת מנכ"ל — ניהול הודעות
  { groupName: 'MH-M365-DepartmentManagers', role: 'deptManager' },
  // MH-M365-Employees / MH-M365-ReadOnly → ברירת מחדל: עובד/ת
];

/** קביעת תפקיד לפי קבוצות המשתמש (id + displayName), ברירת מחדל: עובד */
export function roleFromGroups(groups: { id: string; displayName: string }[]): RoleId {
  const ids = new Set(groups.map((g) => g.id));
  const names = new Set(groups.map((g) => g.displayName));
  for (const { groupName, groupId, role } of ENTRA_GROUP_TO_ROLE) {
    if (names.has(groupName) || (groupId && ids.has(groupId))) return role;
  }
  return 'employee';
}
