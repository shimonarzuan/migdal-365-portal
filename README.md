# Migdal 365 — פורטל עובדים · עיריית מגדל העמק

סביבת העבודה הדיגיטלית של עובדי העירייה, בסגנון Microsoft 365 Admin Center:
תפריט צד קבוע, דשבורד קומפקטי, פורטל אגפי, קרא וחתום, חיפוש חכם ופאנל ניהול מלא.

## הרצה

```bash
npm install
npm run dev        # פיתוח — http://localhost:5173
npm run build      # בניית Production
npm run typecheck  # בדיקת TypeScript
```

## ארכיטקטורה

- **React 19 + TypeScript (Strict) + Vite + Tailwind CSS 4** — RTL מלא, Mobile First
  (במובייל תפריט הצד הופך לסרגל ניווט תחתון), נגישות.
- **קונפיגורציה רב-רשותית** — `src/config/tenant.migdal-haemek.ts` מרכז את כל
  המידע הייחודי לרשות. החלפת רשות = קובץ tenant חדש + שורה ב-`src/config/index.ts`.
  בנוסף, מסך ההגדרות בפאנל הניהול משנה מיתוג וצבעים בזמן אמת (CSS Variables).
- **DataContext** (`src/context/DataContext.tsx`) — Store מרכזי עם אוספים שטוחים
  (עובדים, אגפים, נהלים, אנשי קשר, הודעות, משימות, קישורים, ימי הולדת),
  CRUD גנרי (upsert/remove), חתימות "קרא וחתום" והרשאות לפי תפקיד.
  בשלב ההטמעה מחליפים את המימוש בקריאות API — בלי לגעת ברכיבים.
- **פאנל ניהול** (`src/admin`) — 12 מקטעים; רכיב `EntityManager` גנרי אחד מממש
  CRUD לכל ישות (טבלה + טופס + מחיקה). כניסה למנהלי מערכת בלבד.
- **Lazy Loading** — כל עמוד נטען כ-Chunk נפרד (ראו פלט ה-build).

## מבנה

```
src/
  config/      קונפיגורציית הרשות (רב-רשותי)
  context/     DataContext — Store, CRUD, הרשאות, חתימות
  data/        נתוני דמו + טבלת תפקידים
  components/  Topbar (Header עירוני), Sidebar (M365), חיפוש גלובלי, UI
  modules/     ווידג'טים לדף הבית (עמודות ימין/אמצע/שמאל, עוזר AI)
  pages/       דף הבית, אגפים, נהלים, קרא וחתום, אנשי קשר, מערכות, דוחות
  admin/       פאנל הניהול + EntityManager גנרי
  lib/         תאריך עברי/לועזי, ברכות
```

## חיבורים עתידיים

מסך ההגדרות מכיל נקודות עיגון ל-SMTP, Microsoft 365, SharePoint Online ו-Entra ID (SSO).
מודול "העוזר החכם" מוכן לחיבור Copilot / Azure OpenAI.

## מיתוג

לוגו: להניח `public/logo.png` ולעדכן בהגדרות או בקובץ ה-tenant. צבעים: מסך ההגדרות → מיתוג.

## אבטחה וחיבור ל-Microsoft 365

הפורטל תומך בשני מצבי עבודה (נקבע ב-`.env` → `VITE_AUTH_MODE`):

| | פיתוח (`mock`) | ייצור (`msal`) |
|---|---|---|
| התחברות | ללא — בורר משתמש דמו | SSO בלבד דרך Microsoft Entra ID |
| עובדים ואגפים | אלפון מקומי | Microsoft Graph (כולל מנהלים לעץ הארגוני) |
| קרא וחתום | זיכרון מקומי | רשימת SharePoint "ReadAndSign" |
| ספריות Microsoft | לא נטענות כלל | MSAL + Graph Client (Lazy) |

**עקרונות אבטחה:** OAuth 2.0 + OpenID Connect דרך `@azure/msal-browser` (ללא מימוש ידני), Tokens ב-sessionStorage בלבד (לא localStorage), חידוש אוטומטי (`acquireTokenSilent`), אפס סודות בקוד — הכול ב-Environment Variables, קבצי `.env*` ב-.gitignore. ל-SPA אין Client Secret (PKCE).

**שכבת Services** (`src/services/`): `config` (env) · `authService` (MSAL) · `graphService` (כל קריאות Graph: פרופיל מלא, תמונה, קבוצות, כלל המשתמשים) · `sharepointService` (דרך Graph בלבד) · `employeeService` · `departmentService` · `readAndSignService` · `bootstrapService` (טעינה לפי מצב).

**הקמת Enterprise Application ב-Entra ID:**
1. Azure Portal → Entra ID → App registrations → New registration.
2. סוג: Single-page application (SPA), Redirect URI: כתובת הפורטל (HTTPS).
3. API permissions (Delegated): `User.Read`, `User.ReadBasic.All`, `Sites.Read.All` + הענקת Admin consent.
4. העתיקו Tenant ID + Client ID ל-`.env` (על בסיס `.env.example`), קבעו `VITE_AUTH_MODE=msal`.
5. ב-SharePoint: צרו רשימה `ReadAndSign` עם עמודות `ProcedureId`, `UserId`, `SignedAt`.
