import type { Procedure } from '@/types';
import { makeEntityService } from './entityService';

/** נהלים (רשימת SharePoint: Procedures; קבצים בספריית מסמכים) */
export const procedureService = makeEntityService<Procedure>('procedures', 'Procedures');

/** נהלים גלויים לעובד לפי הרשאת תוכן פנימי */
export function visibleProcedures(items: Procedure[], canSeeInternal: (deptId: string) => boolean): Procedure[] {
  return items.filter((p) => canSeeInternal(p.deptId) || !p.internal);
}
