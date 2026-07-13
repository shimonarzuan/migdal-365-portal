import { isMsalMode } from './config';
import { loadCollection, saveCollection } from './storageService';
import { logger } from './logger';

/**
 * ─── entityService — מפעל שירותי נתונים אחיד ────────────────────────────────
 * כל ישות מקבלת service עם אותו חוזה: load / persist / persistRemove.
 * mock: localStorage. production: רשימת SharePoint (דרך Graph).
 * הקומפוננטות לעולם לא ניגשות לנתונים ישירות — רק דרך DataContext → services.
 */

export interface EntityService<T extends { id: string }> {
  collection: string;
  spListName: string;
  /** טעינה ראשונית (mock: localStorage; production: SharePoint) */
  load(): Promise<T[] | null>;
  /** התמדת מצב מלא של האוסף (נקרא אחרי כל שינוי ב-Store) */
  persist(items: T[]): void;
  /** רישום מחיקה בייצור */
  persistRemove(id: string): void;
}

export function makeEntityService<T extends { id: string }>(collection: string, spListName: string): EntityService<T> {
  return {
    collection,
    spListName,

    async load(): Promise<T[] | null> {
      if (!isMsalMode) return loadCollection<T>(collection);
      try {
        const { getListItems } = await import('./sharepointService');
        const items = await getListItems(spListName);
        return items.length ? (items as unknown as T[]) : null;
      } catch (err) {
        logger.warn(`entityService(${collection}): טעינה מ-SharePoint נכשלה`, err);
        return null;
      }
    },

    persist(items: T[]): void {
      saveCollection(collection, items);
      if (isMsalMode) {
        // production: סנכרון פריט-פריט מנוהל בפעולות עצמן (upsert דרך SharePoint).
        // כאן נשמרת עותק מקומי כ-Cache בלבד.
        logger.debug(`entityService(${collection}): persisted ${items.length} items (cache)`);
      }
    },

    persistRemove(id: string): void {
      if (isMsalMode) {
        logger.info(`entityService(${collection}): TODO מחיקת פריט ${id} מרשימת ${spListName}`);
        // TODO (שלב פריסה): DELETE /sites/{siteId}/lists/{list}/items/{itemId}
      }
    },
  };
}
