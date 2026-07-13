# Migdal 365 — מבנה רשימות SharePoint (ייצור)

כל הרשימות נוצרות באתר ה-SharePoint של הפורטל (`VITE_SHAREPOINT_SITE`).
הגישה: Microsoft Graph בלבד (`Sites.ReadWrite.All` לקריאה/כתיבה — ראו `src/services/authService.ts`).
שמות העמודות = השדות שה-services מצפים להם (ראו `src/services/*`).

**סטטוס (13/07/2026): 20 הרשימות למטה כבר נוצרו בפועל** באתר
`https://migdalmuni.sharepoint.com/sites/Migdal365Portal2` (הנתיב `Migdal365Portal`
ללא הסיומת היה תפוס בטננט; `VITE_SHAREPOINT_SITE` עודכן בהתאם). היצירה בוצעה
דרך Microsoft Graph עם אפליקציה זמנית (App-only, `Sites.Manage.All`) שנמחקה
מיד בסיום — הרשאת הכתיבה הרגילה של האפליקציה הראשית (`Sites.ReadWrite.All`,
delegated) הספיקה לקריאה/כתיבת פריטים בזמן ריצה, אך לא ליצירת סכימת רשימות
חדשות (מגבלה ידועה של Graph לטוקנים delegated). רשימת Employees (אופציונלית) לא נוצרה.

## Employees (אופציונלי — ברירת המחדל: משתמשי Entra ID ישירות מ-Graph)
| עמודה | סוג | הערות |
|---|---|---|
| Title | טקסט | שם מלא |
| EmployeeAdId | טקסט | Object ID מ-Entra |
| DeptId | טקסט | מזהה אגף |
| JobTitle | טקסט | |
| Mobile / Ext / Email | טקסט | |
| ManagerId | טקסט | לעץ הארגוני |

## Departments
| עמודה | סוג |
|---|---|
| Title (שם האגף) | טקסט |
| DeptId | טקסט (מפתח) |
| Icon | טקסט (אימוג׳י) |
| Description | טקסט רב-שורתי |
| ManagerName / ContactEmail / Phone | טקסט |

## Announcements
| עמודה | סוג |
|---|---|
| Title | טקסט |
| Body | טקסט רב-שורתי |
| AnnouncementType | בחירה: mayor/ceo/spokesperson/hr/it/department/emergency |
| Kind | בחירה: announcement/news/banner |
| Audience | בחירה: all/department |
| DeptId | טקסט (ריק = כלל-עירוני) |
| Priority | בחירה: normal/high/urgent |
| PublishDate / ExpiryDate | תאריך |
| CreatedBy | טקסט (userId) |
| Attachments | קבצים מצורפים |
| IsPinned | כן/לא |

## Tasks
| עמודה | סוג |
|---|---|
| Title | טקסט |
| Description | טקסט רב-שורתי |
| AssigneeType | בחירה: general/department/personal |
| AssigneeIds | טקסט (JSON מערך userIds) |
| DeptId | טקסט |
| DueDate | תאריך |
| Status | בחירה: open/inProgress/done |
| Priority | בחירה: low/normal/high |
| CreatedBy | טקסט |

## Procedures
| עמודה | סוג |
|---|---|
| Title | טקסט |
| Description | טקסט רב-שורתי |
| DeptId | טקסט |
| FileUrl | קישור (לקובץ בספריית המסמכים) |
| UpdatedAt | תאריך |
| Internal | כן/לא |
| RequiresReadAndSign | כן/לא |

## ReadAndSignDocuments
| עמודה | סוג |
|---|---|
| Title | טקסט |
| Description | טקסט רב-שורתי |
| FileUrl | קישור |
| AudienceType | בחירה: all/department/role/specific |
| AudienceIds | טקסט (JSON מערך) |
| DueDate | תאריך |
| Status | בחירה: draft/published |
| CreatedBy | טקסט |
| CreatedAt | תאריך ושעה |

## ReadAndSignAssignments
| עמודה | סוג |
|---|---|
| DocumentId | טקסט |
| EmployeeId | טקסט |
| AssignedAt | תאריך ושעה |
| DueDate | תאריך |

## ReadAndSignApprovals
| עמודה | סוג |
|---|---|
| DocumentId | טקסט |
| EmployeeId | טקסט |
| ApprovedAt | תאריך ושעה |

## ReadAndSignReminders
| עמודה | סוג |
|---|---|
| DocumentId | טקסט |
| SentAt | תאריך ושעה |
| SentBy | טקסט |
| RecipientCount | מספר |

## AuditLog
| עמודה | סוג |
|---|---|
| UserId / UserDisplayName | טקסט |
| Action | טקסט: created/updated/deleted/signed/published/reminderSent/roleChanged |
| EntityType / EntityId | טקסט |
| OldValue / NewValue | טקסט רב-שורתי (JSON) |
| Timestamp | תאריך ושעה |
| Source | בחירה: portal/admin |
| IpAddress | טקסט (מתמלא בצד שרת) |

## QuickLinks
| עמודה | סוג |
|---|---|
| Title | טקסט |
| Url | קישור |
| Icon | טקסט (אימוג׳י) |

## Birthdays
| עמודה | סוג |
|---|---|
| Title (שם) | טקסט |
| DeptName | טקסט |
| BirthDate | טקסט DD/MM |
| Emoji | טקסט |

## רשימה קיימת: ReadAndSign (תאימות)
חתימות על נהלים (לא Workflow): ProcedureId, UserId, SignedAt.

## EmployeeRights
| עמודה | סוג | הערות |
|---|---|---|
| Title | טקסט | |
| Category | בחירה: vacation/sickLeave/electionDay/parental/reserveDuty/pension/studyFund/salary/forms/faq/safety/conduct | |
| Body | טקסט רב-שורתי | |
| DocumentUrl | קישור | לקובץ בספריית EmployeeRightsDocuments |
| UpdatedAt | תאריך | |

תוכן הבסיס (חוברת זכויות העובד 20/05/2025) מקודד ב-`src/data/employeeRights.ts` ומשמש
כשהרשימה ריקה; עם מילוי הרשימה — היא גוברת.

## ReceptionHoursCache
| עמודה | סוג | הערות |
|---|---|---|
| DeptName | טקסט | |
| Group | טקסט | קבוצת אגפים לתצוגה (מטה העירייה / רווחה / חינוך…) |
| Days | טקסט (JSON מערך ימים) | |
| HoursText | טקסט | שעות קבלת קהל |
| PhoneHoursText | טקסט | שעות מענה טלפוני אם שונות |
| Notes | טקסט | 'בתיאום מראש' וכו' |
| Contacts | טקסט רב-שורתי (JSON) | בעלי תפקידים: name/role/phone/email |
| Phone / Email | טקסט | |
| Location | טקסט | |
| SourceUrl | קישור | עמוד המקור באתר העירייה |
| UpdatedAt | תאריך ושעה | |

מטמון בלבד — לא נערך ע"י משתמשים. מתמלא ע"י תהליך משיכה תקופתי בצד שרת
(Azure Function / Power Automate) שקורא את אתר העירייה ושומר כאן; הדפדפן
קורא מכאן דרך Graph בלבד (`getListItems`) ואינו מבצע Scraping ישיר.
עותק שמור של נתוני האמת (שנשאבו מהאתר ב-06/07/2026) מקודד ב-
`src/data/receptionHours.ts` ומשמש כשכבת נפילה כשהרשימה ריקה.

## Notifications
| עמודה | סוג | הערות |
|---|---|---|
| Type | בחירה: task/rsDocument/birthday/announcement/procedure/event/emergency | |
| Title | טקסט | |
| Message | טקסט רב-שורתי | |
| Priority | בחירה: normal/high/urgent | |
| TargetPage | טקסט | PageId יעד בפורטל |
| SourceModule | טקסט | |
| CreatedAt | תאריך ושעה | |

בייצור מלא: שורות מוזנות ע"י תהליכי Power Automate (למשל בעת פרסום הודעה
או שיוך משימה) — אותו טיפוס `Notification` בקוד. שלב 1 (נוכחי): ההתראות
נגזרות מקומית מהאוספים הקיימים (`notificationService.deriveNotifications`),
ומצב "נקרא" בלבד נשמר.

## FormDefinitions — מנוע הטפסים
| עמודה | סוג | הערות |
|---|---|---|
| Title | טקסט | שם הטופס |
| Category | טקסט | קטגוריה לקיבוץ במסך העובד |
| Icon / Color | טקסט | אימוג׳י + hex לכרטיס |
| Tags | טקסט (JSON מערך) | |
| DeptId | טקסט | אגף אחראי |
| ProcedureId | טקסט | קישור לנוהל (אופציונלי) |
| Declaration | טקסט רב-שורתי | הצהרה/התחייבות לפני שליחה |
| Status | בחירה: draft/published/archived | רק published מוצג לעובדים |
| ValidFrom / ValidUntil | תאריך | חלון תוקף (אופציונלי) |
| Fields | טקסט רב-שורתי (JSON) | הגדרות השדות (FormFieldDef[]) |
| Workflow | טקסט רב-שורתי (JSON) | צעדי אישור (WorkflowStep[]) — מגיש→מנהל ישיר→HR→מנכ"ל וכו', דינמי לחלוטין |
| Permissions | טקסט רב-שורתי (JSON) | כללי קהל: view/fill/viewSubmissions (FormAudienceRule[]) |
| Pdf | טקסט רב-שורתי (JSON) | `PdfSettings`: enabled, templateId, fileName (תומך {employeeName}/{formTitle}/{date}/{submissionId}) |
| Mail | טקסט רב-שורתי (JSON) | `MailSettings`: לכל צעד Workflow (ו"final" לבסיום) — נמענים (מגיש/מנהל ישיר/תפקיד/אגף/עובד/קבוצת Entra/כתובת מותאמת) + attachPdf |
| Archive | טקסט רב-שורתי (JSON) | `ArchiveSettings`: enabled, libraryName (ספריית SharePoint), folderPath (תומך {formTitle}/{yyyy}/{mm}) |
| Version | מספר | עולה בכל עריכת טופס מפורסם |
| CreatedBy / CreatedAt / UpdatedAt | טקסט/תאריך | |

**כל טופס הוא נתון** — נוצר ומנוהל מפאנל הניהול (ניהול טפסים ← עורך טופס בעל
8 לשוניות: כללי/שדות/Workflow/הרשאות/PDF/שליחת מייל/ארכיון SharePoint/Audit),
ללא קוד. שלושת הטפסים הרשמיים (לימודים/עבודה נוספת/מידע פלילי) מקודדים כ-Seed
ב-`src/data/formDefinitions.ts` ומשמשים כשהרשימה ריקה. הפקת ה-PDF בפועל, שליחת
המייל בפועל וההעלאה לארכיון SharePoint ימומשו בשירות רקע (Azure Function/Power
Automate) — הקוד בפורטל מכין רק את ההגדרות (Interfaces: `pdfService`,
`mailService`) והשירות יקרא אותן.

## FormSubmissions
| עמודה | סוג | הערות |
|---|---|---|
| FormId | טקסט | מזהה שורת FormDefinitions |
| FormVersion | מספר | גרסת הטופס בזמן ההגשה |
| EmployeeId / EmployeeName | טקסט | זהות מאומתת של המגיש/ה — מחליפה חתימה ידנית |
| Values | טקסט רב-שורתי (JSON) | ערכי השדות (חתימה = Data URL) |
| Status | בחירה: pending/approved/rejected | |
| Steps | טקסט רב-שורתי (JSON) | מסלול הצעדים (FormSubmissionStep[]) |
| CurrentStepIndex | מספר | הצעד הממתין הנוכחי |
| SubmittedAt | תאריך ושעה | |
| DecidedBy / DecidedAt | טקסט / תאריך ושעה | ההחלטה הסופית |
| DecisionNotes | טקסט רב-שורתי | מוצג לעובד/ת |

## LearningModules — מודול לומדה
| עמודה | סוג | הערות |
|---|---|---|
| Title | טקסט | |
| Description | טקסט רב-שורתי | |
| ContentType | בחירה: video/pdf/richText/link | |
| ContentUrl | קישור | video/pdf/link |
| ContentBody | טקסט רב-שורתי | richText |
| Quiz | טקסט רב-שורתי (JSON) | LearningQuizQuestion[]: id/question/options/correctIndex |
| PassScore | מספר | אחוז תשובות נכונות נדרש (0 = ללא מבחן) |
| AudienceType | בחירה: all/department/role/specific | |
| AudienceIds | טקסט (JSON מערך) | |
| DueDate | תאריך | אופציונלי |
| Status | בחירה: draft/published | |
| CreatedBy / CreatedAt / UpdatedAt | טקסט/תאריך ושעה | |

## LearningCompletions — מעקב השלמה ("מי ביצע מה ומתי")
| עמודה | סוג | הערות |
|---|---|---|
| ModuleId | טקסט | |
| EmployeeId | טקסט | |
| StartedAt | תאריך ושעה | |
| CompletedAt | תאריך ושעה | ריק = בתהליך |
| Score | מספר | אחוז תשובות נכונות |
| Passed | כן/לא | |
| Answers | טקסט רב-שורתי (JSON) | questionId → אינדקס התשובה שנבחרה |

## MailQueue — תור דוא"ל (Outbox)
| עמודה | סוג | הערות |
|---|---|---|
| To | טקסט (JSON מערך כתובות) | |
| Subject / Body | טקסט | |
| RelatedType / RelatedId | טקסט | למשל formSubmission + id |
| QueuedAt | תאריך ושעה | |
| Status | בחירה: queued/sent/failed | הדפדפן כותב queued בלבד |

**אין שליחת מייל מהדפדפן.** תהליך Power Automate (או Azure Function) מנטר את
הרשימה, שולח דרך Exchange ומעדכן Status. mock: localStorage (`migdal365.mailQueue`).

## ספריות מסמכים נוספות
- **EmployeeRightsDocuments** — קבצי מדיניות/טפסים עבור מודול "דע את זכויותיך".
- **ProceduresDocuments** — קבצי הנהלים (PDF/DOCX) המקושרים משדה `FileUrl` ברשימת Procedures.

ארבעת קובצי המקור (נוהל לימודים 17988, חוברת זכויות 20/05/2025, נוהל מידע פלילי,
נוהל עבודה נוספת) יש להעלות ל-ProceduresDocuments/EmployeeRightsDocuments ולקשר
דרך FileUrl/DocumentUrl בפאנל הניהול.
