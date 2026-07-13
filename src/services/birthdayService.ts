import type { Birthday } from '@/types';
import { makeEntityService } from './entityService';

/** ימי הולדת (רשימת SharePoint: Birthdays; ייבוא Excel בפאנל הניהול) */
export const birthdayService = makeEntityService<Birthday>('birthdays', 'Birthdays');

/** ימי ההולדת של החודש הנוכחי, ממוינים לפי יום */
export function birthdaysThisMonth(items: Birthday[], now = new Date()): Birthday[] {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return items
    .filter((b) => b.date.split('/')[1] === month)
    .sort((a, b) => a.date.localeCompare(b.date));
}
