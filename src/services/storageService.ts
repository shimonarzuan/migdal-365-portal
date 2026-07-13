import { logger } from './logger';

/**
 * ─── storageService — התמדה במצב mock ───────────────────────────────────────
 * שומר אוספים ב-localStorage (מפתח לכל אוסף) כך שתוכן שנוצר בפאנל הניהול
 * שורד רענון דפדפן. בייצור ההתמדה עוברת ל-SharePoint דרך ה-services.
 */

const PREFIX = 'migdal365.';

export function loadCollection<T>(name: string): T[] | null {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch (err) {
    logger.warn(`storage: קריאת ${name} נכשלה`, err);
    return null;
  }
}

export function saveCollection<T>(name: string, items: T[]): void {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(items));
  } catch (err) {
    logger.warn(`storage: שמירת ${name} נכשלה`, err);
  }
}

export function clearCollection(name: string): void {
  localStorage.removeItem(PREFIX + name);
}
