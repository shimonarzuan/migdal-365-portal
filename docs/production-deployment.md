# Migdal 365 — פריסה לייצור (Production Deployment)

מסמך זה הוא **פרומפט מוכן להרצה** — אפשר להעתיק את "הפרומפט לסוכן" בסוף ולהדביק
בשיחת Claude Code חדשה (או Codex/כל סוכן קוד עם גישה ל-`az` CLI ו-`gh` CLI מחוברים),
או לעקוב אחריו ידנית שלב-שלב.

## למה Static Web Apps ולא App Service

הפורטל הוא **SPA טהור** — כל קריאה ל-Graph/SharePoint יוצאת ישירות מהדפדפן דרך
MSAL (PKCE, בלי Client Secret, בלי שרת אמצע). אין קוד שרת בכלל. לכן:

- **Azure Static Web Apps** — Tier חינמי, HTTPS+CDN מובנה, GitHub Actions
  אוטומטי (build+deploy בכל push), Custom Domain חינמי. **ההמלצה.**
- App Service — מיותר: משלמים על שרת שלא עושה כלום מעבר להגשת קבצים סטטיים.

## שלבים שרק בן-אדם עם הרשאות Global/Application Admin יכול לעשות (לא ניתן להאציל לסוכן)

אלו דורשים לחיצות במסך Azure Portal + הרשאות Entra Admin שלא ניתנות ל-CLI Token רגיל:

1. **Azure Portal → Entra ID → App registrations → Migdal365** (App ID הקיים:
   `f40b7a20-50d4-4394-b784-c8356a3393d8`) → **Authentication** → הוסף Redirect
   URI נוסף: `https://<הדומיין-הסופי>` (בנוסף לקיים `http://localhost:5173`).
2. **אם עדיין לא ניתן Admin Consent** ל-API permissions (`User.Read`,
   `User.ReadBasic.All`, `Sites.Read.All`) — Azure Portal → אותו App registration
   → **API permissions** → **Grant admin consent**.
3. ב-**SharePoint** (`migdalmuni.sharepoint.com/sites/Migdal365Portal`) — לוודא
   שהרשימה `ReadAndSign` קיימת עם העמודות מ-`docs/sharepoint-schema.md` (אם
   עוד לא נוצרה בפועל, ליצור אותה עכשיו לפי הסכמה המתועדת שם).
4. **החלטה על דומיין**: תת-דומיין של העירייה (למשל `portal.migdal-haemek.muni.il`)
   או דומיין ברירת המחדל של Azure (`<app-name>.azurestaticapps.net`). אם דומיין
   מותאם — צריך גישה ל-DNS של העירייה (רשומת CNAME).

## הפרומפט לסוכן (להדביק בשיחה חדשה עם `az`+`gh` CLI מחוברים)

```
אני צריך לפרוס לייצור את פורטל Migdal 365 (React 19 + Vite SPA), שנמצא ב-
"portal/" בתיקייה הנוכחית. המצב הנוכחי: הקוד production-ready (typecheck+build
עוברים נקי), .env.local מכיל ערכי Entra ID אמיתיים (Tenant/Client ID) שאסור
שיעלו ל-Git. אין עדיין ריפו Git מאותחל.

בצע את השלבים הבאים, ועצור ותשאל אותי אם משהו לא ברור או דורש בחירה שלי
(שם ריפו, שם Resource Group, region, שם ה-Static Web App):

1. אתחל git repo ב-portal/ אם לא קיים, ודא ש-.gitignore כולל .env*.local
   ו-.env.local (בדוק בפועל לפני commit ראשון — אסור שסודות יעלו).
2. צור ריפו GitHub חדש (gh repo create) בשם שאני אבחר, private, ודחוף את הקוד.
3. באמצעות az cli: היכנס (az login אם צריך), ובחר/צור Resource Group מתאים
   לעיריית מגדל העמק.
4. צור Azure Static Web App (az staticwebapp create) מקושר לריפו ה-GitHub,
   עם build config: app_location="portal" אם הריפו כולל תיקיות נוספות מעבר
   ל-portal, אחרת app_location="/". output_location="dist". זה ייצור אוטומטית
   GitHub Actions workflow (.github/workflows/azure-static-web-apps-*.yml).
5. קרא את קובץ ה-workflow שנוצר אוטומטית ותקן אותו: לפני שלב ה-build, צריך
   ליצור .env.production עם משתני VITE_* מתוך GitHub Secrets (כי משתני
   VITE_ נאפים בזמן build, לא runtime) — הוסף שלב שכותב:
     VITE_AUTH_MODE=msal
     VITE_TENANT_ID=${{ secrets.VITE_TENANT_ID }}
     VITE_CLIENT_ID=${{ secrets.VITE_CLIENT_ID }}
     VITE_REDIRECT_URI=${{ secrets.VITE_REDIRECT_URI }}
     VITE_GRAPH_ENDPOINT=https://graph.microsoft.com/v1.0
     VITE_SHAREPOINT_SITE=migdalmuni.sharepoint.com:/sites/Migdal365Portal
     VITE_ADMIN_UPNS=eran@migdal-haemeq.muni.il
   לתוך portal/.env.production לפני ריצת npm run build.
6. הוסף את הסודות ל-GitHub repo (gh secret set) מתוך הערכים שכבר קיימים
   ב-portal/.env.local (Tenant ID, Client ID) — אל תדפיס אותם ללוג, ואל
   תכתוב אותם לשום קובץ שנכנס ל-git.
7. אחרי שה-Static Web App נוצר, קבל ממנו את ה-URL הסופי (az staticwebapp show)
   ותציג לי אותו — אני אצטרך להוסיף אותו כ-Redirect URI ב-Entra ID App
   Registration בעצמי (זו פעולה שדורשת הרשאות Admin ב-Azure Portal, לא ניתנת
   להאצלה). עדכן גם את VITE_REDIRECT_URI secret ב-GitHub לכתובת הזו.
8. הפעל את ה-workflow (push ריק או הרצה ידנית), עקוב אחרי הלוג, ודווח אם
   ה-build נכשל — כולל הצגת שגיאת ה-build המדויקת, לא רק "נכשל".
9. אחרי deploy מוצלח: פתח את ה-URL, ודא שהאתר עולה (גם אם ניסיון ה-SSO
   ייכשל כי ה-Redirect URI עוד לא אושר בפועל ב-Entra — זה צפוי בשלב זה).
10. סכם לי: כתובת ה-URL הסופית, אילו סודות הוגדרו איפה, מה נשאר לי לעשות
    ידנית ב-Azure Portal (הוספת Redirect URI + Admin consent אם עוד לא ניתן),
    ואיך להריץ עדכון עתידי (git push → deploy אוטומטי).

חוקי הפרויקט שאסור לשבור (מ-CLAUDE.md): אין סודות בקוד/ב-git, RBAC/Audit/
DataContext לא משתנים, אל תיגע בלוגיקת האפליקציה — זו משימת DevOps בלבד.
```

## בדיקת קבלה אחרי הפריסה (Post-Deploy Checklist)

לאחר שהדומיין הסופי מוגדר כ-Redirect URI ב-Entra ID:

1. פתיחת ה-URL → אמור לקפוץ למסך התחברות Microsoft (SSO) → התחברות עם
   משתמש עירייה אמיתי → חזרה לפורטל מחובר.
2. עץ ארגוני: לוודא שעובדים ומנהלים נטענים אמיתיים מ-Graph (לא ריק/שגיאה).
3. קרא וחתום: פרסום מסמך → בדיקה שהרשומה נכתבת בפועל לרשימת SharePoint
   `ReadAndSign` (לא רק ב-state המקומי).
4. פאנל ניהול: מסך "הרשאות" — לוודא שמשתמש מקבוצת `MH-M365-Admins` מזוהה
   כאדמין בפועל (לא רק לפי `VITE_ADMIN_UPNS` fallback).
5. Console הדפדפן — אין שגיאות MSAL/Graph/CORS.
6. מובייל אמיתי — Layout, תפריט תחתון, Touch targets.

## Rollout מדורג (מומלץ, לא טכני)

~500 עובדים, ~300 מהם סייעות עם מובייל בעיקר. מומלץ:
1. שבוע 1: אגף מערכות מידע בלבד (בדיקת עשן).
2. שבוע 2: הנהלה + מנהלי אגפים (בדיקת Workflow קרא-וחתום + טפסים בפועל).
3. שבוע 3+: פריסה מלאה בגלים לפי אגף, עם מייל/הודעה על ה-URL החדש.
