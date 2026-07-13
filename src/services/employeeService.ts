import type { Employee, RoleId } from '@/types';
import { envConfig, isMsalMode } from './config';
import { employees as mockEmployees } from '@/data/employees';
import { getAllUsers, getMe, type GraphUser } from './graphService';

/**
 * ─── employeeService — מקור אמת אחד לעובדים ─────────────────────────────────
 * mock: האלפון המקומי (פיתוח מהיר, ללא רשת ארגונית).
 * msal: משתמשי Entra ID אמיתיים מ-Microsoft Graph, כולל היררכיית מנהלים.
 */

function roleFor(upn: string, jobTitle: string | null): RoleId {
  if (envConfig.adminUpns.includes(upn.toLowerCase())) return 'admin';
  if (jobTitle && /מנהלת? אגף/.test(jobTitle)) return 'deptManager';
  return 'employee';
}

/** המרת משתמש Graph לעובד פורטל */
export function mapGraphUser(u: GraphUser, deptIdOf: (deptName: string | null) => string): Employee {
  return {
    id: u.id,
    firstName: u.givenName ?? u.displayName.split(' ')[0] ?? '',
    lastName: u.surname ?? u.displayName.split(' ').slice(1).join(' '),
    name: u.displayName,
    title: u.jobTitle ?? '',
    deptId: deptIdOf(u.department),
    mobile: u.mobilePhone ?? '',
    ext: u.businessPhones?.[0] ?? '',
    email: u.mail ?? u.userPrincipalName,
    managerName: '',
    managerId: u.manager?.id ?? null,
    roleId: roleFor(u.userPrincipalName, u.jobTitle),
    office: u.officeLocation ?? undefined,
    startDate: u.employeeHireDate?.slice(0, 10) ?? undefined,
  };
}

export async function getEmployees(deptIdOf: (deptName: string | null) => string): Promise<Employee[]> {
  if (!isMsalMode) return mockEmployees;
  const users = await getAllUsers();
  return users.map((u) => mapGraphUser(u, deptIdOf));
}

export async function getCurrentEmployeeId(): Promise<string | null> {
  if (!isMsalMode) return null; // במצב פיתוח נקבע ב-DataContext
  const me = await getMe();
  return me.id;
}
