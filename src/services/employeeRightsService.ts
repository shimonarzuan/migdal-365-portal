import type { EmployeeRightsCategory, EmployeeRightsItem } from '@/types';
import { makeEntityService } from './entityService';

/** דע את זכויותיך (רשימת SharePoint: EmployeeRights; קבצים ב-EmployeeRightsDocuments) */
export const employeeRightsService = makeEntityService<EmployeeRightsItem>('employeeRights', 'EmployeeRights');

export const RIGHTS_CATEGORIES: { id: EmployeeRightsCategory; label: string; icon: string }[] = [
  { id: 'vacation', label: 'חופשות', icon: '🏖️' },
  { id: 'sickLeave', label: 'מחלה', icon: '🤒' },
  { id: 'electionDay', label: 'ימי בחירה', icon: '🗳️' },
  { id: 'parental', label: 'לידה והורות', icon: '👶' },
  { id: 'reserveDuty', label: 'מילואים', icon: '🎖️' },
  { id: 'pension', label: 'פנסיה', icon: '💰' },
  { id: 'studyFund', label: 'קרנות השתלמות', icon: '🎓' },
  { id: 'salary', label: 'שכר', icon: '💵' },
  { id: 'forms', label: 'טפסים', icon: '📋' },
  { id: 'faq', label: 'שאלות נפוצות', icon: '❓' },
  { id: 'safety', label: 'בטיחות בעבודה', icon: '🦺' },
  { id: 'conduct', label: 'התנהגות וסביבת עבודה', icon: '👔' },
];

export function rightsByCategory(items: EmployeeRightsItem[], category: EmployeeRightsCategory): EmployeeRightsItem[] {
  return items.filter((i) => i.category === category);
}

export function searchRights(items: EmployeeRightsItem[], term: string): EmployeeRightsItem[] {
  const q = term.trim();
  if (!q) return items;
  return items.filter((i) => i.title.includes(q) || i.body.includes(q));
}

export function recentRights(items: EmployeeRightsItem[], limit = 5): EmployeeRightsItem[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}
