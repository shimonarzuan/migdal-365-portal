# Migdal 365 — פורטל עובדים עיריית מגדל העמק

מסמך הקשר ל-Claude Code: סיכום מלא של מה שנבנה, הכללים והתהליכים.
קרא לפני כל שינוי. עדכן מסמך זה כשמוסיפים יכולות משמעותיות.

## מה זה

סביבת העבודה הדיגיטלית של עובדי העירייה (~500 עובדים, ~300 סייעות → Mobile First).
React 19 + TypeScript (strict) + Vite + Tailwind CSS 4. RTL מלא, עברית.
**מדיניות UI (החלטת 07/2026): מיגרציה הדרגתית ל-Fluent UI v9** — כל קומפוננטה
חדשה נבנית עם `@fluentui/react-components` (עטופה ב-`shared/fluent.tsx` ←
`<FluentRTL>`); קומפוננטות קיימות עוברות רק כשעורכים אותן; Tailwind נשאר
ל-Layout בלבד. Fluent נטען ב-chunk נפרד (lazy) — לא נכנס ל-Bundle הראשי.
פלטפורמה רב-רשותית: מיתוג ומערכות בקובץ tenant אחד.

**Redesign (07/2026 · Fluent 2 / Linear): אייקוני SVG בלבד** — הותקן
`lucide-react`; מקור אמת יחיד ב-`shared/icons.tsx` (עטיפת `<Icon icon={...}>`
+ `NAV_ICONS`). **אין אימוג'י כאייקונים מבניים** ב-Shell ובדשבורד. Topbar לבן
עם Border תחתון + breadcrumb (לא גרדיאנט); Sidebar 240px מקובץ; Dashboard בנוי
מחדש: Hero טיפוגרפי קומפקטי, KPI stat-bar (רצועה מחולקת ב-Border), Launcher,
Feed התראות, Timeline פעילות. radius מוקטן (4/6/8), צללים כמעט-שקופים, Border
כמפריד עיקרי. **כל ה-UI chrome עבר ל-Lucide** (עמודים, פאנל ניהול, טפסים,
כרטיס עובד, Toast, ErrorBoundary). האימוג'י היחידים שנותרו הם **תוכן-נתונים**
הניתן לעריכה מהפאנל (אייקוני קטגוריות זכויות ב-`employeeRightsService`,
`form.icon`/`dept.icon`/`event.icon`/`link.icon`/`birthday.emoji` — שדות
data של הישויות) — לא chrome. `dashboard` של דף הבית בנוי מ-5 אזורים
(`Home*` widgets); הווידג'טים הישנים (RightColumn/LeftColumn/MyWork/QuickTile/
HomeNotifications/RecentActivity/MyFormsWidget/PerformanceMetrics/
AnnouncementBanner/AiAssistant) הוחלפו ואינם בשימוש — ניתן למחיקה.

**Design System (07/2026): מותג טורקיז מגדל העמק + טוקנים סמנטיים** — הפלטה
(`primary #2A9090` / `primaryDark #1B6B6B` / רקע `#F0F8F8`) מוגדרת ב-
`config/tenant.migdal-haemek.ts`, מוזרקת ב-`AppShell` ומנוקזת ל-**שכבת design
tokens מלאה ב-`styles.css`** (`:root`): משטחים, טקסט (3 רמות), גבולות, מצבים,
סמנטיים (info/success/warning/danger), shadows, radius, spacing, typography,
z-index, transitions. **אין לפזר צבעי hex בקומפוננטות — להשתמש ב-`var(--token)`.**
פרימיטיבים משותפים ב-`shared/ui.tsx`: Panel, Badge (טונים סמנטיים), Btn, Field,
PageHeader, SectionHeader, StatCard, SearchInput, FilterBar, EmptyState,
ErrorState, Spinner. אייקונים = אימוג'י עקבי (מעבר ל-SVG icon-set = שלב נפרד
עתידי, דורש תלות חדשה + ~60 קבצים). צבעי אגפים/קטגוריות (`deptColors.ts`,
`formDefinitions`) הם פלטות קטגוריאליות מכוונות — לא צבעי מותג.

## מה נבנה עד כה (מסונכרן לתאריך העדכון האחרון)

- **Layout בסגנון M365 / Viva** — Header טורקיז (לוגו, ברכה, חיפוש מרכזי,
  הגדרות, עזרה, פעמון התראות, אווטאר), תפריט צד **מקובץ בקבוצות** (ארגון / ידע
  ותהליכים / שירותים / ניהול) עם כיווץ נשמר ואזור גרסה (במובייל: סרגל תחתון).
- **דף בית** — באנר, פס אישי (תאריך עברי/לועזי, מזג אוויר), 6 אריחי קיצור,
  3 עמודות (דבר ראש העיר/חדשות/אירועים · משימות/קרא וחתום · קישורים/AI/ימי הולדת),
  שורת אייקוני אגפים, באנר חירום אדום להודעות emergency.
- **אלפון אמיתי** — 183 עובדים מ"אלפון_עובדים_מאוחד.csv" ב-`src/data/employees.ts`
  (נרמול אגפים מ-OU מלוכלך, זיהוי 157 קשרי מנהל כולל שמות הפוכים). 22 אגפים אמיתיים.
- **עץ ארגוני** — מסך דו-פאנלי (35% עץ / 65% כרטיס עובד): חיפוש Auto-Complete,
  פילטרים (מנהלים/עובדים/אגף), צבע קבוע ומונה לכל אגף, Breadcrumb ניהולי,
  כרטיס עם תמונת Graph, כפתורי פעולה צבעוניים (התקשר/מייל/Teams/העתק),
  כפיפים, מצב פתיחה נשמר (sessionStorage). קומפוננטות ב-`portal/widgets/orgtree/`.
- **דף עובד** — פרופיל + מנהל + כפיפים + משימות.
- **פאנל ניהול** — 12 מקטעים גדורי-RBAC: סקירה, עובדים (ניהול פרטני: פרטים,
  הרשאה, שיוך משימות), אגפים, נהלים, קרא וחתום, הודעות (+דבר ראש העיר+אירועים),
  משימות, קישורים, ימי הולדת, הרשאות, יומן ביקורת, הגדרות (מיתוג חי + אינטגרציות).
- **Workflow קרא וחתום** — מסמך → קהל יעד (כולם/אגף/תפקיד/ספציפי) → פרסום שמייצר
  Assignments → התראה לעובד → אישור → דוח מי חתם/לא + פס התקדמות → תזכורות.
  ישויות: ReadAndSignDocument/Assignment/Approval/Reminder.
- **מנוע טפסים (Forms Engine)** — כל טופס הוא נתון (FormDefinition), נוצר מאשף
  5 שלבים בפאנל (פרטים→שדות[18 סוגים]→הרשאות→Workflow→פרסום) בלי קוד. רנדרר
  גנרי (`portal/forms/FormRenderer`), מנוע אישורים דינמי (`approvalEngine` —
  מנהל ישיר/תפקיד/אגף/עובד/קבוצה), Inbox אישורים לעובד, גרסאות, שכפול,
  Audit פר-טופס, PDF/Mail כ-Interfaces (`pdfService`/`mailService` — Outbox
  ל-MailQueue, שליחה עתידית ב-Power Automate). 3 טפסי האמת = seeds
  (`data/formDefinitions.ts`).
- **RBAC** — 6 תפקידים × 13 הרשאות ב-`services/permissionService.ts`; בייצור
  מקבוצות Entra לפי שם (`config/entraGroups.config.ts`: MH-M365-Admins/IT/HR/
  Spokesperson/Mayor/CEO/DepartmentManagers).
- **Audit Log** — כל פעולה ניהולית (userId, action, entity, old/new, timestamp,
  source, ipAddress placeholder). mock: localStorage · ייצור: רשימת AuditLog.
- **Microsoft 365** — MSAL (SPA + PKCE, sessionStorage, חידוש אוטומטי), Graph
  (פרופיל מלא+תמונות+קבוצות+כל המשתמשים עם מנהל), SharePoint דרך Graph בלבד.
  Enterprise App קיימת; ערכים אמיתיים ב-`.env.local` (לא ב-Git). אתר:
  migdalmuni.sharepoint.com:/sites/Migdal365Portal.
- **תשתיות** — logger (מוכן ל-App Insights), AppError/errorService/ErrorBoundary,
  Toasts, התמדת mock ב-localStorage (`migdal365.*`), Lazy Loading לכל עמוד.

## חוקי הפרויקט (אל תשבור)

1. אין נתוני דמו — אנשים/אגפים מנתוני אמת בלבד; תוכן מתחיל ריק ומנוהל מהפאנל.
2. רשימת האגפים מהאלפון = מקור אמת גם בייצור; שיוך Graph: מייל→אלפון, אחרת
   נרמול שם (`departmentService.deptIdFromName`). אל תבנה אגפים מ-department גולמי.
3. גישה לנתונים רק דרך `useData()` → services (דו-מצביים: mock/msal).
4. הרשאות רק דרך `can(permission)`; כל מקטע/פעולת אדמין גדורים.
5. כל פעולה ניהולית → Audit (אוטומטי ב-upsert/remove; ידני לפעולות מיוחדות).
6. סודות ב-env בלבד; אין Client Secret ב-SPA; Tokens ב-sessionStorage.
7. ספריות Microsoft נטענות רק במצב msal (dynamic imports) — שמור על ההפרדה.
8. תאימות שדות: TaskItem.done↔status; Announcement.kind (תצוגה)↔type (מקור).

## פקודות

```bash
npm run dev         # פיתוח (mock; משתמש ברירת מחדל: ערן/אדמין; בורר משתמשים ב-Header)
npm run typecheck   # חובה אחרי כל שינוי
npm run build       # חובה אחרי כל שינוי
```

מעבר לייצור: `.env.local` → `VITE_AUTH_MODE=msal` (הערכים כבר מולאו).
איפוס נתוני פיתוח: מחיקת מפתחות `migdal365.*` מ-localStorage.

## מבנה

```
src/portal/   layout + pages + widgets (orgtree/ = העץ הארגוני המודולרי)
src/admin/    פאנל ניהול (EntityManager גנרי + מקטעים)
src/shared/   DataContext, ui, Toast, ErrorBoundary, AuthGate, dates
src/services/ 19 שירותים (auth/graph/sharepoint/permission/audit/logger/entity...)
src/config/   tenant.migdal-haemek.ts, entraGroups.config.ts
src/data/     employees.ts (נתוני אמת!), roles.ts
src/types/    index.ts
docs/         sharepoint-schema.md (סכמות רשימות), roadmap.md
```

## מה נשאר (ראו docs/roadmap.md)

רכיב שרת לתזכורות בפועל (SMTP/Teams) · העלאת קבצים ל-SharePoint · ייבוא Excel
לימי הולדת · חיבור Copilot/Azure OpenAI לעוזר החכם · PWA · Application Insights ·
פריסת Production (HTTPS + Redirect URI נוסף ב-App Registration).
