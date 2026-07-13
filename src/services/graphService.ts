import { Client, type AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { getAccessToken } from './authService';
import { envConfig } from './config';

/**
 * ─── graphService — כל הקריאות ל-Microsoft Graph מרוכזות כאן ────────────────
 * הספרייה הרשמית בלבד; ה-Token מסופק דרך authService (חידוש אוטומטי).
 */

const authProvider: AuthenticationProvider = {
  getAccessToken: () => getAccessToken(),
};

let _client: Client | null = null;
export function graphClient(): Client {
  _client ??= Client.initWithMiddleware({ authProvider, baseUrl: envConfig.graphEndpoint.replace(/\/v1\.0$/, '') });
  return _client;
}

/** שדות המשתמש הנמשכים מ-Graph — לפי מפרט האבטחה */
export const USER_SELECT = [
  'id', 'displayName', 'givenName', 'surname', 'mail', 'department', 'jobTitle',
  'officeLocation', 'mobilePhone', 'businessPhones', 'userPrincipalName', 'employeeId', 'accountEnabled', 'employeeHireDate',
].join(',');

export interface GraphUser {
  id: string;
  accountEnabled?: boolean;
  displayName: string;
  givenName: string | null;
  surname: string | null;
  mail: string | null;
  department: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  businessPhones: string[];
  userPrincipalName: string;
  employeeId: string | null;
  employeeHireDate?: string | null;
  manager?: { id: string } | null;
}

/** הפרופיל של המשתמש המחובר */
export async function getMe(): Promise<GraphUser> {
  return graphClient().api('/me').select(USER_SELECT).get();
}

/** תמונת פרופיל (Blob URL) — או null אם אין */
export async function getMyPhoto(): Promise<string | null> {
  try {
    const blob: Blob = await graphClient().api('/me/photo/$value').get();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** תמונת פרופיל של עובד לפי מזהה (Blob URL) — או null אם אין */
export async function getUserPhoto(userId: string): Promise<string | null> {
  try {
    const blob: Blob = await graphClient().api(`/users/${userId}/photo/$value`).get();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** קבוצות ותפקידים (memberOf) של המשתמש המחובר */
export async function getMyGroups(): Promise<{ id: string; displayName: string }[]> {
  const res = await graphClient().api('/me/memberOf').select('id,displayName').top(100).get();
  return (res.value ?? []).filter((g: { displayName?: string }) => g.displayName);
}

/** כלל עובדי הארגון, כולל קישור למנהל (לעץ הארגוני) — עם עימוד */
export async function getAllUsers(): Promise<GraphUser[]> {
  const users: GraphUser[] = [];
  const req = graphClient().api('/users')
    .select(USER_SELECT)
    .expand('manager($select=id)')
    .top(999);
  let res = await req.get();
  users.push(...res.value);
  while (res['@odata.nextLink']) {
    res = await graphClient().api(res['@odata.nextLink']).get();
    users.push(...res.value);
  }
  // סינון חשבונות מושבתים בצד הלקוח (חוסך דרישת ConsistencyLevel בשאילתה)
  return users.filter((u) => u.accountEnabled !== false);
}
