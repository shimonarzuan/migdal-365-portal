import type { Announcement } from '@/types';
import { makeEntityService } from './entityService';

/** הודעות — כלל-עירוניות, אגפיות, חירום (רשימת SharePoint: Announcements) */
export const announcementService = makeEntityService<Announcement>('announcements', 'Announcements');

/** הודעות בתוקף בלבד (סינון expiryDate) ממוינות: חירום → נעוצות → תאריך */
export function activeAnnouncements(items: Announcement[], today = new Date().toISOString().slice(0, 10)): Announcement[] {
  return items
    .filter((a) => !a.expiryDate || a.expiryDate >= today)
    .filter((a) => a.date <= today)
    .sort((a, b) =>
      Number(b.type === 'emergency') - Number(a.type === 'emergency') ||
      Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
      b.date.localeCompare(a.date));
}
