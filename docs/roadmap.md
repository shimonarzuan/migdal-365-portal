# Migdal 365 — Roadmap

## שלב 1 · Infrastructure ✅
- פרויקט React 19 + TypeScript + Vite + Tailwind 4, RTL, Mobile First
- מבנה תיקיות Enterprise: portal / admin / shared / services / config / types
- שכבת Services אחידה (mock ↔ production) · Logger · Error Handling · Toasts
- קונפיגורציה רב-רשותית + env בלבד לסודות

## שלב 2 · Employee Portal ✅
- דשבורד אישי, אלפון אמיתי (183 עובדים), עץ ארגוני, דפי אגפים ועובדים
- חיפוש מרכזי (directoryService), קישורים מהירים, ימי הולדת, אירועים

## שלב 3 · Workflows ✅ (בסיס)
- קרא וחתום: מסמך → קהל יעד → פרסום → אישורים → תזכורות → דוח
- הודעות מסווגות (ראש העיר/מנכ"ל/דוברות/HR/IT/אגף/חירום) עם דחיפות ותוקף
- משימות: כללית/אגפית/אישית עם סטטוס ועדיפות
- 🔜 שליחת תזכורות בפועל (SMTP/Teams — דורש רכיב שרת)

## שלב 4 · Admin Center ✅ (בסיס)
- 12 מקטעים גדורי-RBAC (permissionService + entraGroups.config)
- Audit Log לכל פעולה ניהולית
- 🔜 העלאת קבצים אמיתית ל-SharePoint · ייבוא Excel לימי הולדת

## שלב 5 · AI Assistant 🔜
- חיבור Azure OpenAI / Microsoft Copilot ל-directoryService
- שאלות בשפה חופשית על נהלים, אנשי קשר ותהליכים

## שלב 6 · Mobile / PWA 🔜
- manifest + Service Worker, התקנה למסך הבית, התראות Push

## שלב 7 · Production Deployment 🔜
- Enterprise App ב-Entra ID (SSO) · רשימות SharePoint (ראו sharepoint-schema.md)
- HTTPS + CDN · Application Insights (logger מוכן) · רכיב שרת לתזכורות
