import type { Employee, LearningModule, LearningCompletion, LearningQuizQuestion } from '@/types';
import { makeEntityService } from './entityService';

/**
 * ─── learningService — מודול לומדה (הדרכה + מבחן + מעקב השלמה) ──────────────
 * יצירה (HR) → קהל יעד → פרסום → צפייה/מבחן ע"י העובד → LearningCompletion
 * (מי + מתי + ציון). mock: localStorage · production: רשימות SharePoint
 * (LearningModules / LearningCompletions — ראו docs/sharepoint-schema.md).
 */

export const learningModuleService = makeEntityService<LearningModule>('learningModules', 'LearningModules');
export const learningCompletionService = makeEntityService<LearningCompletion>('learningCompletions', 'LearningCompletions');

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

/** קהל היעד של מודול לומדה → רשימת עובדים (זהה לתבנית "קרא וחתום") */
export function resolveLearningAudience(mod: LearningModule, employees: Employee[]): Employee[] {
  switch (mod.audienceType) {
    case 'all': return employees;
    case 'department': return employees.filter((e) => mod.audienceIds.includes(e.deptId));
    case 'role': return employees.filter((e) => mod.audienceIds.includes(e.roleId));
    case 'specific': return employees.filter((e) => mod.audienceIds.includes(e.id));
  }
}

/** האם מודול פורסם ומיועד לעובד נתון */
export function isModuleForEmployee(mod: LearningModule, employee: Employee): boolean {
  return mod.status === 'published' && resolveLearningAudience(mod, [employee]).length > 0;
}

export function startCompletion(moduleId: string, employeeId: string): LearningCompletion {
  return { id: uid('lc'), moduleId, employeeId, startedAt: new Date().toISOString() };
}

/** ניקוד מבחן: אחוז תשובות נכונות מתוך כלל השאלות */
export function scoreQuiz(quiz: LearningQuizQuestion[], answers: Record<string, number>): number {
  if (quiz.length === 0) return 100;
  const correct = quiz.filter((q) => answers[q.id] === q.correctIndex).length;
  return Math.round((correct / quiz.length) * 100);
}

export function finishCompletion(
  base: LearningCompletion, mod: LearningModule, answers: Record<string, number>,
): LearningCompletion {
  const score = scoreQuiz(mod.quiz, answers);
  return {
    ...base,
    completedAt: new Date().toISOString(),
    answers,
    score,
    passed: score >= mod.passScore,
  };
}

/** דוח השלמה למודול — מי סיים, מי לא, ואחוז השלמה (לתצוגת "מי ביצע מה ומתי") */
export interface LearningReport {
  module: LearningModule;
  assigned: Employee[];
  completed: (Employee & { completion: LearningCompletion })[];
  pending: Employee[];
  completionPct: number;
}

export function buildLearningReport(
  mod: LearningModule, completions: LearningCompletion[], employees: Employee[],
): LearningReport {
  const assigned = resolveLearningAudience(mod, employees);
  const completionByEmp = new Map(
    completions.filter((c) => c.moduleId === mod.id && c.completedAt).map((c) => [c.employeeId, c]),
  );
  const completed = assigned
    .filter((e) => completionByEmp.has(e.id))
    .map((e) => ({ ...e, completion: completionByEmp.get(e.id)! }));
  const pending = assigned.filter((e) => !completionByEmp.has(e.id));
  return {
    module: mod, assigned, completed, pending,
    completionPct: assigned.length ? Math.round((completed.length / assigned.length) * 100) : 0,
  };
}
