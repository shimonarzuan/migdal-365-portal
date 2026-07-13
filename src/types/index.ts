// ─── Migdal 365 · Core domain types ─────────────────────────────────────────

export type RoleId = 'employee' | 'deptManager' | 'spokesperson' | 'hr' | 'it' | 'admin';

export interface Role {
  id: RoleId;
  label: string;
  canSeeInternal: boolean;
  canEdit: boolean;
  allDepartments: boolean;
}

/** עובד — רשומת אמת מתוך האלפון העירוני (AD) */
export interface Employee {
  id: string;            // שם משתמש (AD)
  firstName: string;
  lastName: string;
  name: string;          // שם תצוגה מלא
  title: string;         // תפקיד
  deptId: string;
  mobile: string;
  ext: string;           // שלוחה
  email: string;
  managerName: string;   // כפי שמופיע באלפון
  managerId: string | null; // קישור לעובד-מנהל (אם זוהה)
  roleId: RoleId;        // הרשאת מערכת
  office?: string;       // משרד/מיקום (Graph: officeLocation)
  startDate?: string;    // תאריך תחילת עבודה (Graph: employeeHireDate)
}

export interface Procedure {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  internal: boolean;
  requiresReadAndSign: boolean;
  deptId: string;
  createdAt?: string;   // לחשוב "חדש" מול "עודכן" במרכז הנהלים
  owner?: string;       // גורם אחראי
}

export interface DocumentItem { id: string; title: string; type: 'PDF' | 'DOCX' | 'XLSX'; size: string }

export interface LinkItem { id: string; title: string; url: string; icon?: string }

export type AnnouncementKind = 'announcement' | 'news' | 'banner';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;                 // publishDate
  deptId?: string;
  pinned?: boolean;             // isPinned
  kind?: AnnouncementKind;      // תאימות: חדשות/באנר
  type?: AnnouncementType;      // מקור ההודעה: mayor | ceo | spokesperson | hr | it | department | emergency
  audience?: 'all' | 'department';
  priority?: AnnouncementPriority;
  expiryDate?: string;
  createdBy?: string;
  attachments?: string[];
}

export interface EventItem { id: string; title: string; date: string; place: string; icon?: string }

export interface DeptMeta {
  id: string;
  name: string;
  icon: string;
  description: string;
  managerName: string;
  contactEmail: string;
  phone: string;
  documents: DocumentItem[];
  links: LinkItem[];
  requiresReadAndSign: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assigneeType?: TaskAssigneeType; // general | department | personal
  assigneeIds?: string[];
  deptId?: string;
  due: string;
  done: boolean;                   // תאימות UI — נגזר מ-status
  status?: TaskStatus;
  priority?: TaskPriority;
  createdBy?: string;
  assigneeId?: string;             // תאימות לאחור
}

export interface Birthday { id: string; name: string; deptName: string; date: string; emoji: string; employeeId?: string }

export interface MayorMessage { mayorName: string; title: string; body: string; date: string }

export interface Settings {
  productName: string;
  municipalityName: string;
  logoUrl: string | null;
  logoFallbackEmoji: string;
  colors: { primary: string; primaryDark: string; accent: string; sky: string };
  mayor: MayorMessage;
  weather: { city: string; tempC: number; icon: string; text: string };
  integrations: { smtp?: string; m365Tenant?: string; sharepointUrl?: string; entraIdTenant?: string; aiEndpoint?: string };
}

/** קונפיגורציית רשות (רב-רשותי) — מיתוג ומערכות בלבד; אנשים מגיעים מהאלפון */
export interface TenantConfig {
  tenantId: string;
  productName: string;
  municipalityName: string;
  logoUrl: string | null;
  logoFallbackEmoji: string;
  colors: { primary: string; primaryDark: string; accent: string };
  mayor: MayorMessage;
  citySystems: LinkItem[];
  weather: { city: string; tempC: number; icon: string; text: string };
  integrations: { entraIdTenant?: string; graphApiBase?: string; aiEndpoint?: string };
}

// ═══ הרחבות Enterprise ═══════════════════════════════════════════════════

// ─── RBAC ───
export type Permission =
  | 'admin.access'
  | 'employees.manage'
  | 'departments.manage'
  | 'procedures.manage'
  | 'announcements.manage'
  | 'tasks.manage'
  | 'links.manage'
  | 'birthdays.manage'
  | 'readsign.manage'
  | 'permissions.manage'
  | 'settings.manage'
  | 'reports.view'
  | 'audit.view'
  | 'employeeRights.manage'
  | 'forms.manage'
  | 'learning.manage';

// ─── Audit Log ───
export interface AuditEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  action: string;              // created | updated | deleted | signed | reminderSent | roleChanged | published
  entityType: string;          // announcement | task | employee | procedure | rsDocument | ...
  entityId: string;
  oldValue: string | null;     // JSON snapshot
  newValue: string | null;     // JSON snapshot
  timestamp: string;           // ISO
  source: 'portal' | 'admin';
  ipAddress: string;           // placeholder — יתמלא בצד שרת/Proxy
}

// ─── Read & Sign Workflow ───
export type RsAudienceType = 'all' | 'department' | 'role' | 'specific';
export type RsDocumentStatus = 'draft' | 'published';

export interface ReadAndSignDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;             // בעתיד: קישור SharePoint
  audienceType: RsAudienceType;
  audienceIds: string[];       // deptIds / roleIds / employeeIds לפי הסוג
  dueDate: string;
  status: RsDocumentStatus;
  createdBy: string;
  createdAt: string;
}

export interface ReadAndSignAssignment {
  id: string;
  documentId: string;
  employeeId: string;
  assignedAt: string;
  dueDate: string;
}

export interface ReadAndSignApproval {
  id: string;
  documentId: string;
  employeeId: string;
  approvedAt: string;
}

export interface ReadAndSignReminder {
  id: string;
  documentId: string;
  sentAt: string;
  sentBy: string;
  recipientCount: number;
}

// ─── הודעות מורחבות ───
export type AnnouncementType = 'mayor' | 'ceo' | 'spokesperson' | 'hr' | 'it' | 'department' | 'emergency';
export type AnnouncementPriority = 'normal' | 'high' | 'urgent';

// ─── משימות מורחבות ───
export type TaskAssigneeType = 'general' | 'department' | 'personal';
export type TaskStatus = 'open' | 'inProgress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

// ─── שגיאות ───
export type AppErrorKind = 'auth' | 'graph' | 'permission' | 'network' | 'validation' | 'unknown';

// ─── דע את זכויותיך ───
export type EmployeeRightsCategory =
  | 'vacation' | 'sickLeave' | 'electionDay' | 'parental' | 'reserveDuty'
  | 'pension' | 'studyFund' | 'salary' | 'forms' | 'faq' | 'safety' | 'conduct';

export interface EmployeeRightsItem {
  id: string;
  category: EmployeeRightsCategory;
  title: string;
  body: string;
  documentUrl?: string;   // בעתיד: קישור לספריית EmployeeRightsDocuments
  updatedAt: string;
}

// ─── קבלת קהל (נמשך מאתר העירייה) ───
export type ReceptionHoursStatus = 'ok' | 'unavailable';
export type ReceptionHoursSource = 'municipality' | 'sharepoint' | 'bundled';

export interface ReceptionContact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface ReceptionHoursEntry {
  id: string;
  deptName: string;
  group?: string;            // קבוצת אגפים לתצוגה (מטה העירייה / רווחה / חינוך...)
  days: string[];            // ['ראשון', 'שלישי', ...] — לסינון ולחישוב "פתוח עכשיו"
  hoursText: string;         // שעות קבלת קהל, למשל '08:15–12:30'
  phoneHoursText?: string;   // שעות מענה טלפוני אם שונות משעות הקהל
  notes?: string;            // 'בתיאום מראש', 'זימון תור מקוון' וכו'
  contacts?: ReceptionContact[];  // בעלי תפקידים
  phone?: string;
  email?: string;
  location?: string;
  sourceUrl: string;         // קישור לעמוד המקור באתר העירייה
  updatedAt: string;         // תאריך עדכון אחרון (של המשיכה מהאתר)
}

// ─── מערכת התראות ───
export type NotificationType =
  | 'task' | 'rsDocument' | 'birthday' | 'announcement' | 'procedure' | 'event' | 'emergency' | 'form' | 'learning';
export type NotificationPriority = 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  priority: NotificationPriority;
  targetPage?: string;   // PageId כמחרוזת — נמנעים מתלות types→layout
  sourceModule: string;
}

// ─── מנוע הטפסים (Forms Engine) ───
// כל טופס הוא נתון (FormDefinition) — נוצר ומנוהל מפאנל הניהול, לא בקוד.
// mock: localStorage · ייצור: רשימות FormDefinitions / FormSubmissions / MailQueue.

/** סוגי שדות — section/divider/title הם אלמנטי Layout ללא ערך */
export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'time' | 'checkbox' | 'radio'
  | 'dropdown' | 'multiselect' | 'employeePicker' | 'departmentPicker'
  | 'fileUpload' | 'signature' | 'yesNo' | 'richText'
  | 'section' | 'divider' | 'title';

export type FormValue = string | boolean | string[];

export interface FormFieldDef {
  id: string;              // מפתח יציב לערך ב-values
  type: FormFieldType;
  label: string;
  required?: boolean;
  options?: string[];      // radio / dropdown / multiselect
  placeholder?: string;
  hint?: string;
  autoFill?: 'name' | 'dept' | 'title' | 'email';  // מילוי אוטומטי מפרטי המשתמש
}

export type FormStatus = 'draft' | 'published' | 'archived';

/** כלל קהל — התאמה לפי קבוצת Entra / אגף / תפקיד / עובד; 'everyone' = כולם */
export interface FormAudienceRule {
  kind: 'everyone' | 'entraGroup' | 'department' | 'role' | 'employee';
  value?: string;          // group name / deptId / RoleId / employeeId
}

export interface FormPermissions {
  view: FormAudienceRule[];             // מי רואה את הטופס במסך העובד
  fill: FormAudienceRule[];             // מי יכול למלא
  viewSubmissions: FormAudienceRule[];  // מי רואה הגשות (בנוסף ל-forms.manage)
}

/** צעד במסלול אישורים דינמי */
export interface WorkflowStep {
  id: string;
  name: string;            // "מנהל ישיר", "HR", "ראש העיר"...
  approverType: 'directManager' | 'role' | 'department' | 'employee' | 'entraGroup';
  approverValue?: string;  // RoleId / deptId / employeeId / group name
}

// ─── PDF — הגדרות הפקה (מימוש בפועל: שירות רקע עתידי) ───
export interface PdfSettings {
  enabled: boolean;
  templateId?: string;   // מזהה/שם תבנית
  fileName?: string;     // דפוס שם קובץ; תומך {employeeName} {formTitle} {date} {submissionId}
}

// ─── שליחת מייל — הפצת PDF/עדכון אחרי כל שלב או בסיום ───
export type MailRecipientKind = 'submitter' | 'directManager' | 'role' | 'department' | 'employee' | 'entraGroup' | 'custom';

export interface MailRecipientRule {
  kind: MailRecipientKind;
  value?: string;   // RoleId / deptId / employeeId / group name / כתובת מייל מותאמת
}

export const FINAL_MAIL_STEP_ID = 'final';

export interface StepMailSettings {
  stepId: string;               // WorkflowStep.id או FINAL_MAIL_STEP_ID לבסיום
  recipients: MailRecipientRule[];
  attachPdf: boolean;
}

export interface MailSettings {
  steps: StepMailSettings[];
}

// ─── ארכיון SharePoint — שמירת ה-PDF שהופק ───
export interface ArchiveSettings {
  enabled: boolean;
  libraryName?: string;   // ספריית מסמכים ב-SharePoint
  folderPath?: string;    // תומך {formTitle} {yyyy} {mm}
}

export interface FormDefinition {
  id: string;
  version: number;         // עולה בכל עריכת טופס מפורסם
  title: string;
  description: string;
  category: string;
  icon: string;            // אימוג׳י
  color?: string;          // צבע כרטיס (hex)
  tags: string[];
  deptId: string;          // אגף אחראי
  procedureId?: string;    // קישור לנוהל שממנו נגזר הטופס
  declaration?: string;    // נוסח הצהרה/התחייבות המוצג לפני שליחה
  status: FormStatus;
  validFrom?: string;      // תוקף (ISO date)
  validUntil?: string;
  fields: FormFieldDef[];
  workflow: WorkflowStep[];        // ריק = החלטה ישירה ע"י forms.manage
  permissions: FormPermissions;
  pdf: PdfSettings;
  mail: MailSettings;
  archive: ArchiveSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type FormSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface FormSubmissionStep {
  stepId: string;
  stepName: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
  notes?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersion?: number;
  employeeId: string;
  employeeName: string;
  values: Record<string, FormValue>;
  status: FormSubmissionStatus;
  submittedAt: string;
  // מסלול Workflow — הגשות ישנות ללא steps מטופלות במסלול legacy (forms.manage)
  steps?: FormSubmissionStep[];
  currentStepIndex?: number;
  decidedBy?: string;
  decidedAt?: string;
  decisionNotes?: string;
}

// ─── Mail Outbox (אין שליחה מ-React — Power Automate מרוקן את התור) ───
export interface MailMessage {
  id: string;
  to: string[];            // כתובות מייל
  subject: string;
  body: string;
  relatedType?: string;    // 'formSubmission' וכו'
  relatedId?: string;
  queuedAt: string;
  status: 'queued';
}

// ─── PDF Service Interface (מימוש עתידי: Azure Function לפי תבנית) ───
export interface PdfRenderRequest {
  form: FormDefinition;
  submission: FormSubmission;
}

export interface PdfRenderResult {
  status: 'notImplemented' | 'disabled' | 'ok';
  url?: string;
  fileName?: string;
}

// ─── לומדה (Learning) — תוכן הדרכה + מבחן + מעקב השלמה ──────────────────────
// אותה תבנית קהל-יעד כמו "קרא וחתום"; ההשלמה (LearningCompletion) היא
// הרשומה שמאפשרת "מי ביצע מה ומתי" — mock: localStorage · ייצור: SharePoint.

export type LearningContentType = 'video' | 'pdf' | 'richText' | 'link';

export interface LearningQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  contentType: LearningContentType;
  contentUrl?: string;     // video/pdf/link
  contentBody?: string;    // richText
  quiz: LearningQuizQuestion[];   // ריק = ללא מבחן (השלמה = צפייה בתוכן בלבד)
  passScore: number;       // אחוז תשובות נכונות נדרש למעבר (0 = אין סף)
  audienceType: RsAudienceType;
  audienceIds: string[];
  dueDate?: string;
  status: RsDocumentStatus;   // draft | published
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningCompletion {
  id: string;
  moduleId: string;
  employeeId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;          // אחוז תשובות נכונות (אם יש מבחן)
  passed?: boolean;
  answers?: Record<string, number>;   // questionId → אינדקס התשובה שנבחרה
}
