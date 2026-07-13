import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Employee, Role, RoleId, DeptMeta, Procedure, Announcement, EventItem,
  TaskItem, Birthday, LinkItem, Settings, Permission, EmployeeRightsItem, Notification,
  FormSubmission, FormDefinition, MailMessage,
  ReadAndSignDocument, ReadAndSignAssignment, ReadAndSignApproval, ReadAndSignReminder,
  LearningModule, LearningCompletion,
} from '@/types';
import { tenant } from '@/config';
import { ROLES, m365Links } from '@/data/roles';
import { employees as realEmployees, realDepartments } from '@/data/employees';
import { initialEmployeeRights } from '@/data/employeeRights';
import { initialProcedures } from '@/data/procedures';
import { initialFormDefinitions } from '@/data/formDefinitions';
import { isMsalMode } from '@/services/config';
import { can as canPermission, resolveRole } from '@/services/permissionService';
import { record as auditRecord } from '@/services/auditService';
import { announcementService } from '@/services/announcementService';
import { taskService } from '@/services/taskService';
import { procedureService } from '@/services/procedureService';
import { birthdayService } from '@/services/birthdayService';
import { employeeRightsService } from '@/services/employeeRightsService';
import { formSubmissionService } from '@/services/formService';
import { formDefinitionService } from '@/services/formsService';
import { mailQueueService } from '@/services/mailService';
import { rsDocumentService, rsAssignmentService, rsApprovalService, rsReminderService } from '@/services/readAndSignService';
import { learningModuleService, learningCompletionService } from '@/services/learningService';
import { deriveNotifications } from '@/services/notificationService';
import { makeEntityService, type EntityService } from '@/services/entityService';
import { loadCollection, saveCollection } from '@/services/storageService';
import { logger } from '@/services/logger';
import { SkeletonBlock } from './Skeleton';

/**
 * ─── DataContext — שכבת ה-State של הפורטל ───────────────────────────────────
 * הקומפוננטות ניגשות לנתונים אך ורק דרך useData(); כל התמדה עוברת דרך
 * ה-services (mock: localStorage · production: Graph/SharePoint).
 */

export interface Collections {
  employees: Employee[];
  departments: DeptMeta[];
  procedures: Procedure[];
  announcements: Announcement[];
  events: EventItem[];
  tasks: TaskItem[];
  links: LinkItem[];
  birthdays: Birthday[];
  rsDocuments: ReadAndSignDocument[];
  rsAssignments: ReadAndSignAssignment[];
  rsApprovals: ReadAndSignApproval[];
  rsReminders: ReadAndSignReminder[];
  employeeRights: EmployeeRightsItem[];
  formSubmissions: FormSubmission[];
  formDefinitions: FormDefinition[];
  mailQueue: MailMessage[];
  learningModules: LearningModule[];
  learningCompletions: LearningCompletion[];
}

/** רישום services לפי אוסף — נקודת המעבר היחידה לנתונים */
const eventService = makeEntityService<EventItem>('events', 'Events');
const linkService = makeEntityService<LinkItem>('links', 'QuickLinks');
const SERVICES: { [K in keyof Collections]?: EntityService<{ id: string }> } = {
  announcements: announcementService,
  tasks: taskService,
  procedures: procedureService,
  birthdays: birthdayService,
  events: eventService,
  links: linkService,
  rsDocuments: rsDocumentService,
  rsAssignments: rsAssignmentService,
  rsApprovals: rsApprovalService,
  rsReminders: rsReminderService,
  employeeRights: employeeRightsService,
  formSubmissions: formSubmissionService,
  formDefinitions: formDefinitionService,
  mailQueue: mailQueueService,
  learningModules: learningModuleService,
  learningCompletions: learningCompletionService,
};

const AUDITED_ACTIONS: Record<string, string> = {
  announcements: 'הודעה', tasks: 'משימה', procedures: 'נוהל', employees: 'עובד',
  departments: 'אגף', links: 'קישור', birthdays: 'יום הולדת',
  rsDocuments: 'מסמך קרא וחתום', events: 'אירוע', employeeRights: 'זכות עובד',
  formSubmissions: 'טופס דיגיטלי', formDefinitions: 'הגדרת טופס',
  learningModules: 'מודול לומדה', learningCompletions: 'השלמת לומדה',
};

function initCollections(): Collections {
  const persisted = <T,>(name: string, fallback: T[]): T[] => loadCollection<T>(name) ?? fallback;
  // תוכן אמת (חוברת הזכויות + הנהלים הרשמיים) משמש בסיס: אוסף ריק = טרם נזרע,
  // לכן הזריעה חוזרת גם אם נמחקו כל הפריטים מהפאנל — זהו קו הבסיס הרשמי.
  const seeded = <T,>(name: string, seed: T[]): T[] => {
    const stored = loadCollection<T>(name);
    return stored?.length ? stored : seed;
  };
  return {
    employees: realEmployees,
    departments: realDepartments,
    procedures: seeded('procedures', initialProcedures),
    announcements: persisted('announcements', []),
    events: persisted('events', []),
    tasks: persisted('tasks', []),
    links: persisted('links', [...tenant.citySystems, ...m365Links]),
    birthdays: persisted('birthdays', []),
    rsDocuments: persisted('rsDocuments', []),
    rsAssignments: persisted('rsAssignments', []),
    rsApprovals: persisted('rsApprovals', []),
    rsReminders: persisted('rsReminders', []),
    employeeRights: seeded('employeeRights', initialEmployeeRights),
    formSubmissions: persisted('formSubmissions', []),
    formDefinitions: seeded('formDefinitions', initialFormDefinitions),
    mailQueue: persisted('mailQueue', []),
    learningModules: persisted('learningModules', []),
    learningCompletions: persisted('learningCompletions', []),
  };
}

function initSettings(): Settings {
  return {
    productName: tenant.productName,
    municipalityName: tenant.municipalityName,
    logoUrl: tenant.logoUrl,
    logoFallbackEmoji: tenant.logoFallbackEmoji,
    colors: { ...tenant.colors, sky: '#37b3b3' },
    mayor: tenant.mayor,
    weather: tenant.weather,
    integrations: { entraIdTenant: tenant.integrations.entraIdTenant },
  };
}

interface DataState {
  data: Collections;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  upsert: <K extends keyof Collections>(col: K, item: Collections[K][number]) => void;
  remove: (col: keyof Collections, id: string) => void;
  // משתמש נוכחי
  user: Employee;
  role: Role;
  userDept: DeptMeta | undefined;
  setUserId: (id: string) => void;
  // RBAC — כל בדיקת הרשאה עוברת דרך permissionService
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
  canSeeInternal: (deptId: string) => boolean;
  canEdit: (deptId: string) => boolean;
  directReports: (empId: string) => Employee[];
  // חתימות נהלים (תאימות) + Workflow קרא וחתום
  signatures: Record<string, string[]>;
  sign: (procId: string) => void;
  hasSigned: (procId: string) => boolean;
  audit: (action: string, entityType: string, entityId: string, oldValue?: unknown, newValue?: unknown) => void;
  // מרכז ההתראות — נגזר מהאוספים הקיימים + מצב "נקרא" מתמיד
  notifications: (Notification & { isRead: boolean })[];
  unreadNotifCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Collections>(initCollections);
  const [settings, setSettings] = useState<Settings>(initSettings);
  const [userId, setUserId] = useState('eran');
  const [roleOverride, setRoleOverride] = useState<RoleId | null>(null); // ייצור: תפקיד מקבוצות Entra
  const [signatures, setSignatures] = useState<Record<string, string[]>>(
    () => loadCollection<{ id: string; userIds: string[] }>('signatures')
      ?.reduce((acc, r) => ({ ...acc, [r.id]: r.userIds }), {}) ?? {},
  );
  const [notifReadIds, setNotifReadIds] = useState<string[]>(
    () => loadCollection<{ id: string }>('notifReads')?.map((r) => r.id) ?? [],
  );
  const [loading, setLoading] = useState(isMsalMode);

  // מראה סינכרונית של האוספים — מאפשרת ל-upsert/remove לחשב את המצב הבא מחוץ
  // ל-updater של setData (ש-StrictMode מריץ פעמיים ולכן אסור בו side effects:
  // persist/audit הופעלו כפול). הרפרנס מתעדכן מיידית כדי שכמה קריאות upsert
  // באותו tick (למשל פרסום "קרא וחתום" שמייצר Assignments בלולאה) לא ידרסו זו את זו.
  const dataRef = useRef(data);
  dataRef.current = data;

  // ─── ייצור: טעינה מ-Microsoft Graph / SharePoint + תפקיד מקבוצות Entra ───
  useEffect(() => {
    if (!isMsalMode) return;
    (async () => {
      try {
        const { bootstrapPortalData } = await import('@/services/bootstrapService');
        const b = await bootstrapPortalData();
        setData((d) => ({ ...d, employees: b.employees, departments: b.departments }));
        setSignatures(b.signatures);
        if (b.currentUserId) setUserId(b.currentUserId);
        const me = b.employees.find((e) => e.id === b.currentUserId);
        setRoleOverride(await resolveRole(me?.roleId ?? 'employee'));
      } catch (err) {
        logger.error('bootstrap נכשל', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const user = data.employees.find((u) => u.id === userId) ?? data.employees[0];
  const effectiveRoleId: RoleId = isMsalMode ? (roleOverride ?? 'employee') : user.roleId;
  const role = ROLES[effectiveRoleId];
  const userDept = data.departments.find((d) => d.id === user.deptId);

  const value = useMemo<DataState>(() => {
    const audit = (action: string, entityType: string, entityId: string, oldValue?: unknown, newValue?: unknown) =>
      auditRecord({ userId: user.id, userDisplayName: user.name, action, entityType, entityId, oldValue, newValue });

    const readSet = new Set(notifReadIds);
    const notifications = deriveNotifications({
      employeeId: user.id,
      deptId: user.deptId,
      tasks: data.tasks,
      rsAssignments: data.rsAssignments,
      rsApprovals: data.rsApprovals,
      rsDocuments: data.rsDocuments,
      birthdays: data.birthdays,
      announcements: data.announcements,
      procedures: data.procedures,
      events: data.events,
      formSubmissions: data.formSubmissions,
      formDefinitions: data.formDefinitions,
      employees: data.employees,
      learningModules: data.learningModules,
      learningCompletions: data.learningCompletions,
    }).map((n) => ({ ...n, isRead: readSet.has(n.id) }));

    return {
      data,
      settings,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),

      upsert: (col, item) => {
        const list = dataRef.current[col] as { id: string }[];
        const id = (item as { id: string }).id;
        const old = list.find((x) => x.id === id);
        const next = old ? list.map((x) => (x.id === id ? item : x)) : [...list, item];
        dataRef.current = { ...dataRef.current, [col]: next };
        setData(dataRef.current);
        SERVICES[col]?.persist(next);
        if (AUDITED_ACTIONS[col]) audit(old ? 'updated' : 'created', col, id, old, item);
      },

      remove: (col, id) => {
        const list = dataRef.current[col] as { id: string }[];
        const old = list.find((x) => x.id === id);
        const next = list.filter((x) => x.id !== id);
        dataRef.current = { ...dataRef.current, [col]: next };
        setData(dataRef.current);
        SERVICES[col]?.persist(next);
        SERVICES[col]?.persistRemove(id);
        if (AUDITED_ACTIONS[col]) audit('deleted', col, id, old, null);
      },

      user,
      role,
      userDept,
      setUserId,
      can: (permission) => canPermission(role.id, permission),
      isAdmin: role.id === 'admin',
      canSeeInternal: (deptId) => role.allDepartments || (role.canSeeInternal && user.deptId === deptId),
      canEdit: (deptId) => role.allDepartments || (role.canEdit && user.deptId === deptId),
      directReports: (empId) => data.employees.filter((e) => e.managerId === empId),

      signatures,
      sign: (procId) => {
        setSignatures((s) => {
          const next = { ...s, [procId]: [...new Set([...(s[procId] ?? []), user.id])] };
          saveCollection('signatures', Object.entries(next).map(([id, userIds]) => ({ id, userIds })));
          return next;
        });
        audit('signed', 'procedure', procId, null, { by: user.id });
        if (isMsalMode) {
          import('@/services/sharepointService')
            .then(({ addListItem }) => addListItem('ReadAndSign', { ProcedureId: procId, UserId: user.id, SignedAt: new Date().toISOString() }))
            .catch(() => logger.warn('חתימת נוהל: SharePoint לא זמין — נשמר מקומית'));
        }
      },
      hasSigned: (procId) => (signatures[procId] ?? []).includes(user.id),
      audit,

      notifications,
      unreadNotifCount: notifications.filter((n) => !n.isRead).length,
      markNotificationRead: (id) => setNotifReadIds((ids) => {
        const next = [...new Set([...ids, id])];
        saveCollection('notifReads', next.map((i) => ({ id: i })));
        return next;
      }),
      markAllNotificationsRead: () => setNotifReadIds(() => {
        const next = [...new Set(notifications.map((n) => n.id))];
        saveCollection('notifReads', next.map((i) => ({ id: i })));
        return next;
      }),
    };
  }, [data, settings, user, role, userDept, signatures, notifReadIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8]" role="status" aria-label="טוען נתונים מ-Microsoft 365">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-5 gap-3">
          <SkeletonBlock className="size-9 rounded-full" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <div className="flex">
          <div className="hidden md:flex flex-col gap-3 p-3 w-20 border-l border-slate-200 bg-white min-h-[calc(100vh-64px)]">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-12 w-full rounded-xl" />)}
          </div>
          <div className="flex-1 p-5 space-y-4">
            <SkeletonBlock className="h-24 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

/** נהלים + מסמכי Workflow הממתינים לאישור המשתמש הנוכחי */
export function usePendingSignatures() {
  const { data, canSeeInternal, hasSigned } = useData();
  return data.procedures
    .filter((p) => p.requiresReadAndSign && !hasSigned(p.id))
    .filter((p) => canSeeInternal(p.deptId) || !p.internal)
    .map((p) => ({ ...p, dept: data.departments.find((d) => d.id === p.deptId) }));
}

/** מסמכי "קרא וחתום" (Workflow) שהוקצו למשתמש וטרם אושרו */
export function usePendingRsDocuments() {
  const { data, user } = useData();
  const myAssignments = data.rsAssignments.filter((a) => a.employeeId === user.id);
  const approvedDocIds = new Set(data.rsApprovals.filter((a) => a.employeeId === user.id).map((a) => a.documentId));
  return myAssignments
    .filter((a) => !approvedDocIds.has(a.documentId))
    .map((a) => ({ assignment: a, document: data.rsDocuments.find((d) => d.id === a.documentId) }))
    .filter((x): x is { assignment: ReadAndSignAssignment; document: ReadAndSignDocument } => Boolean(x.document && x.document.status === 'published'));
}
