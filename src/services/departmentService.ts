import type { DeptMeta } from '@/types';
import { realDepartments, employees as alphonEmployees } from '@/data/employees';
import type { GraphUser } from './graphService';

/**
 * ─── departmentService — האגפים תמיד לפי הטבלה (האלפון) ─────────────────────
 * רשימת 22 האגפים המנורמלת נגזרה מקובץ האלפון והיא מקור האמת — גם בייצור.
 * במצב msal אנו לא בונים אגפים מחדש מערכי ה-department הגולמיים של Entra
 * (שמכילים ערכי AD מלוכלכים) אלא משייכים כל משתמש Graph לאגף מהטבלה:
 *   1. התאמה לפי דוא"ל/UPN מול רשומת האלפון (הכי מדויק).
 *   2. נרמול שם האגף מ-Entra מול שמות/כינויי האגפים.
 *   3. ברירת מחדל: "כללי".
 */

/** כינויים ווריאציות של שמות אגפים (כמו בסקריפט ההמרה של האלפון) */
const DEPT_ALIASES: Record<string, string> = {
  'מערכות מידע / מחשוב': 'מערכות מידע',
  'מחשוב': 'מערכות מידע',
  'שפ"ח / שירות פסיכולוגי': 'שפ"ח',
  'שירות פסיכולוגי': 'שפ"ח',
  'מוקד': 'מוקד עירוני',
  'פיקוח': 'פיקוח עירוני',
  'ביטחון וחירום': 'ביטחון',
  'חירום וביטחון': 'ביטחון',
  'הון אנושי': 'משאבי אנוש',
  'גזברות / כספים': 'גזברות',
  'כספים': 'גזברות',
};

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

export function getMockDepartments(): DeptMeta[] {
  return realDepartments;
}

/** שיוך שם אגף (מ-Entra) לאגף מהטבלה — לפי שם מלא, כינוי או הכלה */
export function deptIdFromName(rawName: string | null | undefined): string {
  if (!rawName) return 'other';
  const name = DEPT_ALIASES[norm(rawName)] ?? norm(rawName);
  const exact = realDepartments.find((d) => d.name === name);
  if (exact) return exact.id;
  const partial = realDepartments.find((d) => name.includes(d.name) || d.name.includes(name));
  return partial?.id ?? 'other';
}

/** אגף "כללי" למי שלא שויך */
const OTHER_DEPT: DeptMeta = {
  id: 'other', name: 'כללי', icon: '🏢',
  description: 'עובדים ללא שיוך אגף מזוהה.',
  managerName: '', contactEmail: '', phone: '',
  documents: [], links: [], requiresReadAndSign: false,
};

/**
 * מיפוי משתמשי Graph לאגפי הטבלה:
 * מחזיר את רשימת האגפים הקבועה + פונקציית שיוך per-user.
 */
export function buildDeptMapping(users: GraphUser[]): { departments: DeptMeta[]; deptIdOfUser: (u: GraphUser) => string } {
  // אינדקס האלפון לפי דוא"ל ולפי שם משתמש (החלק שלפני ה-@)
  const byEmail = new Map<string, string>();
  for (const e of alphonEmployees) {
    if (e.email) {
      byEmail.set(e.email.toLowerCase(), e.deptId);
      byEmail.set(e.email.toLowerCase().split('@')[0], e.deptId);
    }
    byEmail.set(e.id.toLowerCase(), e.deptId); // id = שם משתמש AD
  }

  const deptIdOfUser = (u: GraphUser): string => {
    const upn = u.userPrincipalName?.toLowerCase() ?? '';
    const mail = u.mail?.toLowerCase() ?? '';
    const candidates = [mail, upn, mail.split('@')[0], upn.split('@')[0]].filter(Boolean);
    for (const c of candidates) {
      const hit = byEmail.get(c);
      if (hit) return hit;
    }
    return deptIdFromName(u.department);
  };

  const departments = realDepartments.some((d) => d.id === 'other')
    ? realDepartments
    : [...realDepartments, OTHER_DEPT];

  // סימון כמות המשויכים ל"כללי" — עוזר לזהות פערי מיפוי בעת ההטמעה
  return { departments, deptIdOfUser };
}
