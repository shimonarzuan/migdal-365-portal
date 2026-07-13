import type {
  TaskItem, ReadAndSignAssignment, ReadAndSignApproval, ReadAndSignDocument,
  Birthday, Announcement, Procedure, EventItem, Notification, FormSubmission,
  FormDefinition, Employee, LearningModule, LearningCompletion,
} from '@/types';
import { activeAnnouncements } from './announcementService';
import { formById } from './formsService';
import { approvalEngine } from './approvalEngine';
import { isModuleForEmployee } from './learningService';

/**
 * ─── notificationService — מרכז ההתראות ─────────────────────────────────────
 * שלב 1: ההתראות נגזרות (Pure) מתוך האוספים הקיימים — אין ישות CRUD נפרדת.
 * מצב "נקרא" מנוהל בנפרד (DataContext, כמו signatures). בעתיד: רשימת
 * SharePoint בשם Notifications, מוזנת ע"י Power Automate — אותו טיפוס Notification.
 */

export interface NotificationSource {
  employeeId: string;
  deptId?: string;
  tasks: TaskItem[];
  rsAssignments: ReadAndSignAssignment[];
  rsApprovals: ReadAndSignApproval[];
  rsDocuments: ReadAndSignDocument[];
  birthdays: Birthday[];
  announcements: Announcement[];
  procedures: Procedure[];
  events: EventItem[];
  formSubmissions: FormSubmission[];
  formDefinitions: FormDefinition[];
  employees: Employee[];
  learningModules: LearningModule[];
  learningCompletions: LearningCompletion[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const withinDays = (dateStr: string | undefined, now: Date, days: number): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return false;
  return now.getTime() - d <= days * DAY_MS && now.getTime() - d >= -DAY_MS;
};

const todayMonthDay = (now: Date) => `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

export function deriveNotifications(src: NotificationSource, now = new Date()): Notification[] {
  const out: Notification[] = [];

  // משימות אישיות פתוחות
  for (const t of src.tasks) {
    if (t.done || t.assigneeId !== src.employeeId) continue;
    out.push({
      id: `task-${t.id}`, type: 'task', title: 'משימה חדשה', message: t.title,
      createdAt: t.due, priority: t.priority === 'high' ? 'high' : 'normal',
      targetPage: 'home', sourceModule: 'tasks',
    });
  }

  // מסמכי קרא וחתום (Workflow) הממתינים לאישור
  const approvedIds = new Set(src.rsApprovals.filter((a) => a.employeeId === src.employeeId).map((a) => a.documentId));
  for (const a of src.rsAssignments) {
    if (a.employeeId !== src.employeeId || approvedIds.has(a.documentId)) continue;
    const doc = src.rsDocuments.find((d) => d.id === a.documentId);
    if (!doc || doc.status !== 'published') continue;
    out.push({
      id: `rs-${a.id}`, type: 'rsDocument', title: 'מסמך חדש לחתימה', message: doc.title,
      createdAt: a.assignedAt, priority: 'high', targetPage: 'readsign', sourceModule: 'readsign',
    });
  }

  // ימי הולדת היום
  const md = todayMonthDay(now);
  for (const b of src.birthdays) {
    if (b.date !== md) continue;
    out.push({
      id: `bday-${b.id}`, type: 'birthday', title: 'יום הולדת היום', message: `${b.emoji} ${b.name}`,
      createdAt: now.toISOString(), priority: 'normal', targetPage: 'home', sourceModule: 'birthdays',
    });
  }

  // הודעות ראש העיר / דוברות / חירום — פעילות ומתפרסמות לאחרונה
  for (const a of activeAnnouncements(src.announcements)) {
    if (!['mayor', 'ceo', 'spokesperson', 'emergency'].includes(a.type ?? '')) continue;
    if (!withinDays(a.date, now, 3)) continue;
    out.push({
      id: `ann-${a.id}`, type: a.type === 'emergency' ? 'emergency' : 'announcement',
      title: a.type === 'emergency' ? 'הודעת חירום' : a.type === 'mayor' ? 'הודעה חדשה מראש העיר' : a.type === 'spokesperson' ? 'הודעה חדשה מהדוברות' : 'הודעה חדשה',
      message: a.title, createdAt: a.date, priority: a.type === 'emergency' ? 'urgent' : (a.priority === 'high' ? 'high' : 'normal'),
      targetPage: 'home', sourceModule: 'announcements',
    });
  }

  // נהלים חדשים / שעודכנו
  for (const p of src.procedures) {
    if (withinDays(p.createdAt, now, 7)) {
      out.push({ id: `proc-new-${p.id}`, type: 'procedure', title: 'נוהל חדש', message: p.title, createdAt: p.createdAt!, priority: 'normal', targetPage: 'procedures', sourceModule: 'procedures' });
    } else if (withinDays(p.updatedAt, now, 7) && p.updatedAt !== p.createdAt) {
      out.push({ id: `proc-upd-${p.id}`, type: 'procedure', title: 'נוהל עודכן', message: p.title, createdAt: p.updatedAt, priority: 'normal', targetPage: 'procedures', sourceModule: 'procedures' });
    }
  }

  // מנוע הטפסים: החלטות על ההגשות שלי (בשבוע האחרון) + הגשות שממתינות לאישורי
  for (const s of src.formSubmissions) {
    const form = formById(src.formDefinitions, s.formId);
    if (s.employeeId === src.employeeId && s.status !== 'pending' && withinDays(s.decidedAt, now, 7)) {
      out.push({
        id: `form-${s.id}`, type: 'form',
        title: s.status === 'approved' ? 'הטופס אושר ✅' : 'הטופס נדחה ❌',
        message: form?.title ?? s.formId,
        createdAt: s.decidedAt!, priority: 'normal', targetPage: 'forms', sourceModule: 'forms',
      });
    }
    if (form && approvalEngine.isApprover(src.employeeId, s, form, src.employees)) {
      out.push({
        id: `form-approve-${s.id}`, type: 'form',
        title: '📋 טופס ממתין לאישורך',
        message: `${form.title} · ${s.employeeName}`,
        createdAt: s.submittedAt, priority: 'high', targetPage: 'forms', sourceModule: 'forms',
      });
    }
  }

  // מודולי לומדה חדשים שטרם הושלמו ע"י העובד
  const me = src.employees.find((e) => e.id === src.employeeId);
  const myCompletedModuleIds = new Set(
    src.learningCompletions.filter((c) => c.employeeId === src.employeeId && c.completedAt).map((c) => c.moduleId),
  );
  if (me) {
    for (const m of src.learningModules) {
      if (myCompletedModuleIds.has(m.id) || !isModuleForEmployee(m, me)) continue;
      out.push({
        id: `learning-${m.id}`, type: 'learning', title: 'לומדה חדשה', message: m.title,
        createdAt: m.updatedAt, priority: m.dueDate ? 'high' : 'normal', targetPage: 'learning', sourceModule: 'learning',
      });
    }
  }

  // אירועים קרובים (עד 3 ימים קדימה)
  for (const e of src.events) {
    if (!withinDays(e.date, now, 3)) continue;
    out.push({ id: `event-${e.id}`, type: 'event', title: 'אירוע קרוב', message: e.title, createdAt: e.date, priority: 'normal', targetPage: 'home', sourceModule: 'events' });
  }

  const priorityRank: Record<Notification['priority'], number> = { urgent: 0, high: 1, normal: 2 };
  return out.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt.localeCompare(a.createdAt));
}
