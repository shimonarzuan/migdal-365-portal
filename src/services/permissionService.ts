import type { Permission, RoleId } from '@/types';
import { isMsalMode } from './config';
import { roleFromGroups } from '@/config/entraGroups.config';

/**
 * ─── permissionService — RBAC מרכזי ─────────────────────────────────────────
 * מקור אמת אחד להרשאות. כל מסך וכל פעולה בפאנל הניהול נבדקים כאן.
 * mock: התפקיד מגיע מקובץ הנתונים (employee.roleId).
 * production: התפקיד נקבע מקבוצות Entra ID (ראו entraGroups.config.ts).
 */

const ALL: Permission[] = [
  'admin.access', 'employees.manage', 'departments.manage', 'procedures.manage',
  'announcements.manage', 'tasks.manage', 'links.manage', 'birthdays.manage',
  'readsign.manage', 'permissions.manage', 'settings.manage', 'reports.view', 'audit.view',
  'employeeRights.manage', 'forms.manage', 'learning.manage',
];

/** מטריצת הרשאות: תפקיד → מה מותר */
const MATRIX: Record<RoleId, Permission[]> = {
  admin: ALL,
  it: ['admin.access', 'links.manage', 'settings.manage', 'readsign.manage', 'reports.view', 'audit.view', 'procedures.manage'],
  hr: ['admin.access', 'employees.manage', 'birthdays.manage', 'readsign.manage', 'tasks.manage', 'reports.view', 'employeeRights.manage', 'forms.manage', 'learning.manage'],
  spokesperson: ['admin.access', 'announcements.manage'],
  deptManager: ['tasks.manage', 'reports.view'],
  employee: [],
};

export function can(role: RoleId, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsOf(role: RoleId): Permission[] {
  return MATRIX[role] ?? [];
}

/**
 * קביעת תפקיד המשתמש המחובר.
 * mock: מהרשומה המקומית. production: מקבוצות Entra ID דרך Graph.
 */
export async function resolveRole(localRole: RoleId): Promise<RoleId> {
  if (!isMsalMode) return localRole;
  const { getMyGroups } = await import('./graphService');
  const groups = await getMyGroups();
  return roleFromGroups(groups);
}

/** שגיאת הרשאה אחידה — לשימוש בפעולות מוגנות */
export function assertCan(role: RoleId, permission: Permission): void {
  if (!can(role, permission)) {
    throw Object.assign(new Error(`אין הרשאה לפעולה: ${permission}`), { kind: 'permission' });
  }
}
