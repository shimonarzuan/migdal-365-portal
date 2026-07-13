import type { TaskItem, Employee } from '@/types';
import { makeEntityService } from './entityService';

/** משימות (רשימת SharePoint: Tasks) */
export const taskService = makeEntityService<TaskItem>('tasks', 'Tasks');

/** האם משימה רלוונטית לעובד: אישית / אגפית / כללית */
export function isTaskForEmployee(t: TaskItem, emp: Employee): boolean {
  const assignees = t.assigneeIds ?? (t.assigneeId ? [t.assigneeId] : []);
  if (assignees.length > 0) return assignees.includes(emp.id);
  if (t.deptId) return t.deptId === emp.deptId;
  return true; // משימה כללית
}

export function taskStatus(t: TaskItem): 'open' | 'inProgress' | 'done' {
  return t.status ?? (t.done ? 'done' : 'open');
}
