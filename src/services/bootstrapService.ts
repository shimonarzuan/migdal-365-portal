import type { Employee, DeptMeta } from '@/types';
import { isMsalMode } from './config';
import { getAllUsers, getMe } from './graphService';
import { mapGraphUser } from './employeeService';
import { buildDeptMapping, getMockDepartments } from './departmentService';
import { employees as mockEmployees } from '@/data/employees';
import { getListItems } from './sharepointService';

/**
 * ─── bootstrapService — טעינת נתוני הפורטל לפי מצב עבודה ────────────────────
 * נקודת כניסה אחת: mock ⇒ מיידי מהאלפון המקומי; msal ⇒ Graph + SharePoint.
 */

export interface PortalBootstrap {
  employees: Employee[];
  departments: DeptMeta[];
  currentUserId: string | null;
  signatures: Record<string, string[]>;
}

export async function bootstrapPortalData(): Promise<PortalBootstrap> {
  if (!isMsalMode) {
    return { employees: mockEmployees, departments: getMockDepartments(), currentUserId: null, signatures: {} };
  }
  const [users, me] = await Promise.all([getAllUsers(), getMe()]);
  // האגפים תמיד לפי טבלת האלפון; משתמשי Graph משויכים אליהם (מייל → נרמול שם)
  const { departments, deptIdOfUser } = buildDeptMapping(users);
  const employees = users.map((u) => mapGraphUser(u, () => deptIdOfUser(u)));

  const signatures: Record<string, string[]> = {};
  try {
    for (const f of await getListItems('ReadAndSign')) {
      const procId = String(f.ProcedureId ?? ''), userId = String(f.UserId ?? '');
      if (procId && userId) signatures[procId] = [...(signatures[procId] ?? []), userId];
    }
  } catch {
    // רשימת SharePoint טרם הוקמה — ממשיכים בלי חתימות
  }

  return { employees, departments, currentUserId: me.id, signatures };
}
