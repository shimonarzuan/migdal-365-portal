import type { ReceptionHoursEntry, ReceptionHoursSource, ReceptionHoursStatus } from '@/types';
import { receptionHoursSnapshot, RECEPTION_SNAPSHOT_DATE } from '@/data/receptionHours';
import { isMsalMode } from './config';
import { logger } from './logger';

/**
 * ─── receptionHoursService — זמני קבלת קהל באגפי העירייה ────────────────────
 * נתוני אמת בלבד. סדר הניסיונות:
 * 1. משיכה ישירה מאתר העירייה (צפוי להיכשל מהדפדפן עקב CORS — אתר ציבורי
 *    רגיל, ללא API/כותרות CORS מתאימות; מבוצע כאן, לא בקומפוננטה).
 * 2. נפילה חזרה למטמון SharePoint (ReceptionHoursCache) — ייצור בלבד.
 * 3. עותק שמור (src/data/receptionHours.ts) — נתוני אמת שנשאבו מאתר העירייה
 *    בתאריך ה-Snapshot; מוצג עם ציון תאריך העדכון.
 *
 * רענון אוטומטי אמיתי דורש רכיב שרת (Azure Function / Power Automate) שמבצע
 * Scraping מבוקר בצד שרת ושומר את התוצאה ב-ReceptionHoursCache.
 */

export const MUNICIPALITY_URL = 'https://www.migdal-haemeq.muni.il/Pages/default.aspx';

export interface ReceptionHoursResult {
  status: ReceptionHoursStatus;
  source: ReceptionHoursSource;
  entries: ReceptionHoursEntry[];
  fetchedAt: string;
}

const DIRECT_FETCH_TIMEOUT_MS = 4000;

async function tryDirectFetch(): Promise<ReceptionHoursEntry[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DIRECT_FETCH_TIMEOUT_MS);
  try {
    // ניסיון ישיר — צפוי להיחסם ע"י CORS מדפדפן (אתר העירייה אינו API ואינו חושף כותרות CORS).
    // Timeout קצר כדי לא להשהות את המשתמש אם האתר החיצוני איטי/לא זמין.
    await fetch(MUNICIPALITY_URL, { mode: 'cors', signal: controller.signal });
    // אין כאן פענוח HTML בצד לקוח (מסוכן/שביר) — גם אם הבקשה תצליח, יש להמתין
    // לשכבת Adapter עתידית שתחזיר JSON מובנה במקום HTML גולמי.
    return null;
  } catch (err) {
    logger.debug('receptionHoursService: משיכה ישירה מאתר העירייה נכשלה (צפוי — CORS/timeout)', err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryCache(): Promise<ReceptionHoursEntry[] | null> {
  if (!isMsalMode) return null;
  try {
    const { getListItems } = await import('./sharepointService');
    const items = await getListItems('ReceptionHoursCache');
    if (!items.length) return null;
    return items.map((it, i) => ({
      id: String(it.id ?? `${it.DeptName ?? 'dept'}-${i}`),
      deptName: String(it.DeptName ?? ''),
      group: it.Group ? String(it.Group) : undefined,
      days: typeof it.Days === 'string' ? JSON.parse(it.Days) : [],
      hoursText: String(it.HoursText ?? ''),
      phoneHoursText: it.PhoneHoursText ? String(it.PhoneHoursText) : undefined,
      notes: it.Notes ? String(it.Notes) : undefined,
      contacts: typeof it.Contacts === 'string' ? JSON.parse(it.Contacts) : undefined,
      phone: it.Phone ? String(it.Phone) : undefined,
      email: it.Email ? String(it.Email) : undefined,
      location: it.Location ? String(it.Location) : undefined,
      sourceUrl: String(it.SourceUrl ?? MUNICIPALITY_URL),
      updatedAt: String(it.UpdatedAt ?? ''),
    }));
  } catch (err) {
    logger.warn('receptionHoursService: קריאת מטמון SharePoint נכשלה', err);
    return null;
  }
}

export async function fetchReceptionHours(): Promise<ReceptionHoursResult> {
  const fetchedAt = new Date().toISOString();
  const direct = await tryDirectFetch();
  if (direct) return { status: 'ok', source: 'municipality', entries: direct, fetchedAt };
  const cached = await tryCache();
  if (cached) return { status: 'ok', source: 'sharepoint', entries: cached, fetchedAt };
  // עותק שמור — נתוני אמת שנשאבו מאתר העירייה בתאריך ה-Snapshot
  return { status: 'ok', source: 'bundled', entries: receptionHoursSnapshot, fetchedAt: RECEPTION_SNAPSHOT_DATE };
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/** האם מקטע שעות (מופרד ב-·) חל על היום הנוכחי — לפי ציוני ימים כמו א' או א'-ה' */
function segmentAppliesToday(segment: string, dayIdx: number): boolean {
  const range = segment.match(/([אבגדהוש])'\s*-\s*([אבגדהוש])'/);
  const singles = [...segment.matchAll(/([אבגדהוש])'/g)].map((m) => m[1]);
  if (!range && singles.length === 0) return true; // אין ציון יום — חל בכל ימי הפעילות
  if (range) {
    const from = DAY_LETTERS.indexOf(range[1]);
    const to = DAY_LETTERS.indexOf(range[2]);
    if (from <= dayIdx && dayIdx <= to) return true;
  }
  return singles.includes(DAY_LETTERS[dayIdx]);
}

/** "פתוח עכשיו" — בדיקה זהירה לפי מקטעי הימים; מחזירה false אם המידע לא ניתן לפענוח */
export function isOpenNow(entry: ReceptionHoursEntry, now = new Date()): boolean {
  const dayIdx = now.getDay();
  if (!entry.days.includes(HEBREW_DAYS[dayIdx])) return false;
  if (entry.hoursText.includes('24/7')) return true;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  // מקטעים מופרדים ב-· או בפסיק — כל מקטע נושא ציון ימים משלו ("וביום א' גם...")
  return entry.hoursText.split(/[·,]/).some((segment) => {
    if (!segmentAppliesToday(segment, dayIdx)) return false;
    return [...segment.matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g)].some((m) => {
      const [h1, m1, h2, m2] = [m[1], m[2], m[3], m[4]].map(Number);
      return minutesNow >= h1 * 60 + m1 && minutesNow <= h2 * 60 + m2;
    });
  });
}
