import { FINAL_MAIL_STEP_ID, type FormDefinition } from '@/types';

/**
 * ─── הגדרות טפסים — נתוני Seed אמיתיים ──────────────────────────────────────
 * שלושת הטפסים הרשמיים שתומללו 1:1 מהנהלים (נספח 1 לנוהל לימודים, חלק א'
 * לנוהל עבודה נוספת, נספח א' לנוהל מידע פלילי) — כעת כשורות FormDefinition
 * במנוע הטפסים. ה-ids נשמרו לתאימות הגשות קיימות. מכאן והלאה טפסים חדשים
 * נוצרים מפאנל הניהול (ניהול טפסים ← טופס חדש) — ללא קוד.
 */

const CREATED = '2026-07-06';
const OPEN_TO_ALL = [{ kind: 'everyone' as const }];

export const initialFormDefinitions: FormDefinition[] = [
  {
    id: 'form-studies',
    version: 1,
    title: 'בקשה ליציאה ללימודים אקדמיים/מקצועיים',
    description: 'נספח 1 לנוהל אישור לימודים — יש להגיש טרם פתיחת הסמסטר הראשון. הבקשה מועברת לוועדת ההשתלמויות (מנכ"לית, מנהלת מש"א, גזבר) לאחר המלצת הממונה הישיר.',
    category: 'משאבי אנוש',
    icon: '🎓',
    color: '#0f6cbd',
    tags: ['לימודים', 'השתלמות', 'ועדה'],
    deptId: 'hr',
    procedureId: 'proc-studies',
    declaration: 'חובה לצרף את תכנית הלימודים ומכתב קצר המפרט כיצד הלימודים יסייעו לעובד/ת בתפקידו/ה (יועברו למשאבי אנוש). התחייבות: אני מתחייב/ת לתקופת עבודה של שנה נוספת בעירייה החל מיום סיום אישור היציאה ללימודים; אם אעזוב לפני תום התקופה — אחזיר את החלק היחסי של הסכום עבור שעות ההיעדרות שאושרו לי, ולעירייה הרשות לקזזו מכל סכום שיגיע לי; ידוע לי כי האישור מותנה בלימודים בפועל ואודיע ללא דיחוי אם אפסיק את לימודיי.',
    status: 'published',
    fields: [
      { id: 'idNumber', type: 'text', label: 'מספר תעודת זהות', required: true },
      { id: 'role', type: 'text', label: 'תפקיד', autoFill: 'title', required: true },
      { id: 'roleTenure', type: 'text', label: 'ותק בתפקיד (שנים)', required: true },
      { id: 'scope', type: 'text', label: 'היקף משרה', placeholder: 'למשל: 100%', required: true },
      { id: 'dept', type: 'text', label: 'אגף / מחלקה', autoFill: 'dept', required: true },
      { id: 'degreeType', type: 'dropdown', label: 'סוג התואר', options: ['תואר ראשון', 'אחר'], required: true },
      { id: 'profession', type: 'text', label: 'המקצוע / תחום הלימודים', required: true },
      { id: 'studyDays', type: 'text', label: 'ימי הלימודים', placeholder: 'למשל: ימי שלישי', required: true },
      { id: 'studyHours', type: 'text', label: 'שעות הלימודים', placeholder: 'למשל: 16:00-20:00', required: true },
      { id: 'institution', type: 'text', label: 'מוסד הלימודים', required: true },
      { id: 'absenceDays', type: 'number', label: 'מספר ימי היעדרות לצורך הלימודים', required: true },
      { id: 'requestDetails', type: 'textarea', label: 'לצורך כך, הנני מבקש/ת', required: true },
      { id: 'commitment', type: 'checkbox', label: 'קראתי את כתב ההתחייבות לתקופת שירות בעירייה ואני מאשר/ת אותו', required: true },
    ],
    workflow: [
      { id: 'ws-manager', name: 'מנהל ישיר', approverType: 'directManager' },
      { id: 'ws-committee', name: 'ועדת השתלמויות (מש"א)', approverType: 'role', approverValue: 'hr' },
    ],
    permissions: { view: OPEN_TO_ALL, fill: OPEN_TO_ALL, viewSubmissions: [] },
    pdf: { enabled: true, templateId: 'default', fileName: 'בקשת-לימודים-{employeeName}-{date}' },
    mail: { steps: [{ stepId: FINAL_MAIL_STEP_ID, recipients: [{ kind: 'role', value: 'hr' }], attachPdf: true }] },
    archive: { enabled: true, libraryName: 'ProceduresDocuments', folderPath: 'בקשות-לימודים/{yyyy}' },
    createdAt: CREATED,
    updatedAt: CREATED,
    createdBy: 'eran',
  },
  {
    id: 'form-extrawork',
    version: 1,
    title: 'בקשה לאישור עבודה נוספת (עבודת חוץ)',
    description: 'חלק א׳ לטופס הבקשה בנוהל עבודה נוספת — לפי סעיפים 176-181 לפקודת העיריות. עובר דרך הממונה הישיר לוועדה (מנכ"לית, מנהלת מש"א, יועמ"ש). האישור תקף עד 31/12 של השנה הנוכחית.',
    category: 'משאבי אנוש',
    icon: '💼',
    color: '#7a3e9d',
    tags: ['עבודה נוספת', 'עבודת חוץ', 'היתר'],
    deptId: 'legal',
    procedureId: 'proc-extrawork',
    declaration: 'התחייבות המבקש/ת: אין בעבודה המבוקשת לפגוע לרעה במילוי תפקידי בעירייה ו/או ליצור ניגוד עניינים, ואם תיווצר אפשרות לפגיעה בעבודה ו/או לניגוד עניינים — הנני מתחייב/ת להפסיק לאלתר את העבודה הנוספת.',
    status: 'published',
    fields: [
      { id: 'role', type: 'text', label: 'תפקיד בעירייה', autoFill: 'title', required: true },
      { id: 'dept', type: 'text', label: 'אגף / מחלקה', autoFill: 'dept', required: true },
      { id: 'supervisorName', type: 'text', label: 'שם הממונה', required: true },
      { id: 'currentDays', type: 'text', label: 'ימי העבודה בעירייה', placeholder: 'למשל: ראשון-חמישי', required: true },
      { id: 'currentHours', type: 'text', label: 'שעות העבודה בעירייה', placeholder: 'למשל: 08:00-16:00', required: true },
      { id: 'requestedWork', type: 'textarea', label: 'העבודה הפרטית המבוקשת', required: true },
      { id: 'extraDaysHours', type: 'text', label: 'ימים ושעות העבודה הנוספת', required: true },
      { id: 'commitment', type: 'checkbox', label: 'קראתי את ההתחייבות ואני מאשר/ת אותה', required: true },
    ],
    workflow: [
      { id: 'ws-manager', name: 'מנהל ישיר', approverType: 'directManager' },
      { id: 'ws-hr', name: 'ועדת עבודה נוספת (מש"א)', approverType: 'role', approverValue: 'hr' },
    ],
    permissions: { view: OPEN_TO_ALL, fill: OPEN_TO_ALL, viewSubmissions: [] },
    pdf: { enabled: true, templateId: 'default', fileName: 'בקשת-עבודה-נוספת-{employeeName}-{date}' },
    mail: { steps: [{ stepId: FINAL_MAIL_STEP_ID, recipients: [{ kind: 'role', value: 'hr' }], attachPdf: true }] },
    archive: { enabled: true, libraryName: 'ProceduresDocuments', folderPath: 'עבודה-נוספת/{yyyy}' },
    createdAt: CREATED,
    updatedAt: CREATED,
    createdBy: 'eran',
  },
  {
    id: 'form-criminal-consent',
    version: 1,
    title: 'הסכמה למסירת מידע מהמרשם הפלילי',
    description: 'נספח א׳ לנוהל קבלת מידע פלילי — טופס הסכמה לפי סעיפים 11/12 לחוק המידע הפלילי ותקנת השבים, התשע"ט-2019. ההגשות נצפות ע"י הגורמים המוסמכים בלבד.',
    category: 'לשכה משפטית',
    icon: '⚖️',
    color: '#b4462b',
    tags: ['מידע פלילי', 'הסכמה', 'מכרזים'],
    deptId: 'legal',
    procedureId: 'proc-criminal',
    declaration: 'אני נותן/ת בזה את הסכמתי לכך שמשטרת ישראל תמסור מידע עליי מהמרשם הפלילי ומהמרשם המשטרתי, לרבות הרשעות ומידע על תיקים תלויים ועומדים, בהתאם להוראות חוק המידע הפלילי ותקנת השבים התשע"ט-2019, ליועמ"ש של עיריית מגדל העמק, לשם שקילת מועמדותי לתפקיד. הסכמתי חלה גם על מסירת מידע מזמן לזמן לשם מעקב תקופתי. הובא לידיעתי כי אני זכאי/ת לעיין בתחנת משטרה ברישומים על שמי, כי רישום אינו שולל בהכרח את קבלת הזכות או התפקיד, וכי אני רשאי/ת לצרף מידע על שיקומי או נסיבותיי האישיות. ידוע לי כי בהסכמתי זו אני מוותר/ת על קבלת הודעה על מסירת המידע, בכפוף להוראות החוק.',
    status: 'published',
    fields: [
      { id: 'idNumber', type: 'text', label: 'מספר תעודת זהות', required: true },
      { id: 'consent', type: 'checkbox', label: 'קראתי את נוסח ההסכמה במלואו ואני מסכים/ה', required: true },
    ],
    workflow: [],  // החלטה ישירה ע"י הגורם המוסמך (forms.manage)
    permissions: {
      view: OPEN_TO_ALL,
      fill: OPEN_TO_ALL,
      viewSubmissions: [{ kind: 'role', value: 'admin' }],  // רגיש — צפייה מצומצמת
    },
    pdf: { enabled: false },  // מידע רגיש — ללא הפקת/הפצת PDF אוטומטית
    mail: { steps: [] },
    archive: { enabled: false },
    createdAt: CREATED,
    updatedAt: CREATED,
    createdBy: 'eran',
  },
];
