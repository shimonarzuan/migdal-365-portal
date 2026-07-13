import type { ReceptionHoursEntry } from '@/types';

/**
 * ─── קבלת קהל — נתוני אמת מאתר העירייה ──────────────────────────────────────
 * עותק שמור (Snapshot) של זמני קבלת הקהל ובעלי התפקידים, כפי שמופיעים באתר
 * הרשמי www.migdal-haemeq.muni.il (דפי האגפים תחת MunicipalServices/) ובריכוז
 * שסופק ע"י אגף מערכות מידע. משמש כשכבת נפילה כשהמשיכה החיה מהאתר חסומה
 * (CORS) ומטמון ה-SharePoint (ReceptionHoursCache) ריק.
 * לרענון: עדכון קובץ זה או מילוי הרשימה ReceptionHoursCache (ראו docs/sharepoint-schema.md).
 */

export const RECEPTION_SNAPSHOT_DATE = '2026-07-06';

const SITE = 'https://www.migdal-haemeq.muni.il';
const HOME = `${SITE}/Pages/default.aspx`;
const WELFARE = `${SITE}/MunicipalServices/Welfare/Pages/default.aspx`;
const ARNONA = `${SITE}/MunicipalServices/Arnona/Pages/default.aspx`;
const ENGINEERING = `${SITE}/MunicipalServices/Engineering/Pages/default.aspx`;
const TRAFFIC = `${SITE}/MunicipalServices/TrafficTransport/Pages/default.aspx`;
const EMERGENCY = `${SITE}/MunicipalServices/Emergency/Pages/default.aspx`;
const EDUCATION = `${SITE}/Education/Pages/default.aspx`;

const ALL_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const SUN_THU = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const U = RECEPTION_SNAPSHOT_DATE;
const MUNI_HQ = 'שד\' צבי אלדרוטי 14, מגדל העמק (מטה העירייה)';

export const receptionHoursSnapshot: ReceptionHoursEntry[] = [
  // ─── מטה העירייה ───
  {
    id: 'rh-mayor-office', deptName: 'לשכת ראש העיר', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש מול הלשכה',
    contacts: [{ name: 'איילת פוני', role: 'מנהלת לשכת ראש העיר', phone: '04-6507714', email: 'ayeletp@migdal-haemeq.muni.il' }],
    phone: '04-6507714', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-deputies-office', deptName: 'לשכת סגני ראש העיר', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש מול הלשכה',
    contacts: [
      { name: 'מרינה פלנקר', role: 'מזכירת מ"מ וסגן ראש העיר', phone: '04-6507717', email: 'marinapa@migdal-haemeq.muni.il' },
      { name: 'אורה חזן', role: 'מזכירת סגן ראש העיר', phone: '04-6507765', email: 'oraha@migdal-haemeq.muni.il' },
    ],
    location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-ceo-office', deptName: 'מנכ"ל העירייה', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש מול הלשכה',
    contacts: [
      { name: 'ליאורה אדרי', role: 'מנכ"לית העירייה' },
      { name: 'טליה צוויג', role: 'מנהלת לשכת המנכ"לית', phone: '04-6507730', email: 'talyzv@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507730', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-hr', deptName: 'משאבי אנוש (כוח אדם)', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש',
    contacts: [{ name: 'לריסה גורמן', role: 'מנהלת משאבי אנוש', phone: '04-6507731', email: 'jobs@migdal-haemeq.muni.il' }],
    phone: '04-6507731', email: 'jobs@migdal-haemeq.muni.il', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-legal-audit', deptName: 'ייעוץ משפטי ומבקרת העירייה', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש',
    contacts: [
      { name: 'מיסא שחברי', role: 'יועצת משפטית', phone: '04-6507776', email: 'rinato@migdal-haemeq.muni.il' },
      { name: 'טליה רוזין', role: 'מבקרת העירייה', phone: '04-6507778' },
    ],
    location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-treasury', deptName: 'גזברות', group: 'מטה העירייה',
    days: [], hoursText: 'בתיאום מראש',
    contacts: [
      { name: 'עינת סלמן', role: 'גזברית העירייה' },
      { name: 'רותי הרוש', role: 'מזכירת הגזבר', phone: '04-6507740', email: 'rutiha@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507740', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },

  // ─── שירות לתושב ומוקד עירוני ───
  {
    id: 'rh-moked', deptName: 'מוקד 106 ושירות לתושב', group: 'שירות לתושב ומוקד עירוני',
    days: ALL_WEEK, hoursText: 'מענה קולי: 24/7 ברציפות',
    phoneHoursText: 'וואטסאפ (04-6507840): א\'-ה\' 08:00-17:00, ו\' 08:00-12:00',
    contacts: [
      { name: 'עינבר ישייב', role: 'מנהלת השירות והמוקד העירוני', email: 'inbary@migdal-haemeq.muni.il' },
      { name: 'סמדר אמזלג', role: 'מוקד ושירות לתושב' },
    ],
    phone: '106 / 04-6507797', location: MUNI_HQ, sourceUrl: `${SITE}/MunicipalServices/Pages/Moked.aspx`, updatedAt: U,
  },
  {
    id: 'rh-pniot', deptName: 'פניות הציבור', group: 'שירות לתושב ומוקד עירוני',
    days: [], hoursText: 'פנייה דיגיטלית / טלפונית',
    contacts: [
      { name: 'מעיין סיטבון לב', role: 'מנהלת מחלקת פניות הציבור', phone: '04-6507797', email: 'pniot@migdal-haemeq.muni.il' },
      { name: 'סמדר אמזלג', role: 'מוקד ושירות לתושב' },
    ],
    phone: '04-6507797', email: 'pniot@migdal-haemeq.muni.il', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-spokesperson', deptName: 'דוברות', group: 'שירות לתושב ומוקד עירוני',
    days: [], hoursText: 'פנייה טלפונית / דוא"ל',
    contacts: [{ name: 'קובי פורטל', role: 'דובר העירייה', phone: '04-6507831', email: 'kobi@migdal-haemeq.muni.il' }],
    phone: '04-6507831', location: MUNI_HQ, sourceUrl: HOME, updatedAt: U,
  },

  // ─── פיננסים, הנדסה ורישוי ───
  {
    id: 'rh-gvia', deptName: 'גבייה ומינהל הכנסות', group: 'פיננסים, הנדסה ורישוי',
    days: SUN_THU, hoursText: 'א\'-ה\' 08:15-12:30, וביום א\' גם 16:00-18:00',
    phoneHoursText: 'מענה טלפוני (מוקד מילגם וכללי): א\'-ה\' 08:00-20:00, ו\' 08:00-12:00',
    contacts: [
      { name: 'מאיר לחיאני', role: 'מנהל מחלקת הכנסות העירייה' },
      { name: 'נאור לוגסי', role: 'מילגם' },
    ],
    phone: '04-6507705', email: 'gvia@migdal-haemeq.muni.il', location: 'האלה 4, מגדל העמק',
    sourceUrl: ARNONA, updatedAt: U,
  },
  {
    id: 'rh-engineering', deptName: 'הנדסה', group: 'פיננסים, הנדסה ורישוי',
    days: SUN_THU, hoursText: 'א\'-ה\' 08:15-12:30, וביום א\' גם 16:00-18:00',
    phoneHoursText: 'מענה טלפוני: א\'-ה\' 08:00-20:00, ו\' 08:00-12:00',
    contacts: [
      { name: 'שי פורמן', role: 'מהנדס העיר', phone: '04-6507761' },
      { name: 'קלי אזרזר', role: 'מזכירת האגף', phone: '04-6507761', email: 'kelyaz@migdal-haemeq.muni.il' },
      { name: 'אביב בראמי', role: 'סגן מהנדס העיר', email: 'avivb@migdal-haemeq.muni.il' },
      { name: 'רונאל בן סימון', role: 'מנהל מינהלת התחדשות עירונית', phone: '04-6507763', email: 'ronelbe@migdal-haemeq.muni.il' },
      { name: 'רום ברנע', role: 'מנהל פרויקטים בינוי ותשתיות', email: 'robm@migdal-haemeq.muni.il' },
      { name: 'לאה לשם', role: 'מנהלת נכסים ותב"ע', email: 'leale@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507761', location: 'האלה 4, מגדל העמק', sourceUrl: ENGINEERING, updatedAt: U,
  },
  {
    id: 'rh-planning', deptName: 'ועדה לתכנון ובנייה', group: 'פיננסים, הנדסה ורישוי',
    days: SUN_THU, hoursText: 'א\'-ה\' 08:15-12:30, וביום א\' גם 16:00-18:00',
    phoneHoursText: 'מענה טלפוני: א\'-ה\' 08:00-20:00, ו\' 08:00-12:00',
    contacts: [
      { name: 'עדי זכריה', role: 'מנהלת מחלקת רישוי ופיקוח בנייה' },
      { name: 'נורית ברוך', role: 'מזכירת הוועדה', phone: '04-6507794', email: 'nuritba@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507794', location: 'האלה 4, מגדל העמק', sourceUrl: ENGINEERING, updatedAt: U,
  },

  // ─── רווחה ושירותים חברתיים ───
  {
    id: 'rh-welfare-main', deptName: 'מטה רווחה — האגף לשירותים חברתיים', group: 'רווחה ושירותים חברתיים',
    days: ['ראשון', 'רביעי'], hoursText: 'א\' 15:30-18:30 · ד\' 09:00-13:00',
    notes: 'בשאר הימים — בתיאום מראש',
    contacts: [
      { name: 'מומי בן סימון', role: 'מנהל האגף', phone: '04-6507850', email: 'momiben@migdal-haemeq.muni.il' },
      { name: 'רותי רוטשילד', role: 'מנהלת האגף לשירותים חברתיים' },
      { name: 'אפרת ארבע', role: 'מזכירת האגף', phone: '04-6507850', email: 'efrata@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507850', location: 'הזית 1, מגדל העמק', sourceUrl: WELFARE, updatedAt: U,
  },
  {
    id: 'rh-welfare-prat', deptName: 'פרט, משפחה ומוגבלויות', group: 'רווחה ושירותים חברתיים',
    days: SUN_THU, hoursText: 'מענה טלפוני: א\' 08:30-19:00 · ב\'-ה\' 08:30-15:00',
    contacts: [{ name: 'אהובה', role: 'מדור פרט ומשפחה', phone: '04-6507850' }],
    phone: '04-6507850', location: 'הזית 1, מגדל העמק', sourceUrl: WELFARE, updatedAt: U,
  },
  {
    id: 'rh-welfare-otzma', deptName: 'מרכז עוצמה', group: 'רווחה ושירותים חברתיים',
    days: SUN_THU, hoursText: 'א\' 08:00-17:00 · ב\'-ה\' 08:00-15:00',
    notes: 'בתיאום מראש',
    contacts: [{ name: 'אודליה בר', role: 'מנהלת מרכז עוצמה', email: 'Bar_odelya@Walla.com' }],
    location: 'התדהר 4, מגדל העמק', sourceUrl: WELFARE, updatedAt: U,
  },
  {
    id: 'rh-welfare-360', deptName: 'תוכנית 360 (צעירים)', group: 'רווחה ושירותים חברתיים',
    days: SUN_THU, hoursText: 'מענה טלפוני: א\' 08:30-19:00 · ב\'-ה\' 08:30-15:30',
    contacts: [{ name: 'יערה לב אדלסון', role: 'רכזת תוכנית 360', phone: '04-6507868', email: 'yaaraed@gmail.com' }],
    phone: '04-6507868', sourceUrl: WELFARE, updatedAt: U,
  },
  {
    id: 'rh-welfare-seniors', deptName: 'אזרחים ותיקים', group: 'רווחה ושירותים חברתיים',
    days: [], hoursText: 'בתיאום טלפוני',
    contacts: [{ name: 'איסרא עלי', role: 'עו"ס אזרחים ותיקים', phone: '04-6570862' }],
    phone: '04-6570862', location: 'הזית 1, מגדל העמק', sourceUrl: WELFARE, updatedAt: U,
  },
  {
    id: 'rh-klita', deptName: 'קליטה', group: 'רווחה ושירותים חברתיים',
    days: [], hoursText: 'בתיאום טלפוני',
    contacts: [
      { name: 'פאני טבלוביץ\'', role: 'אגף קליטה' },
      { name: 'יוליה קיסליוב', role: 'אגף קליטה', phone: '04-6507747', email: 'yuliah@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507747', sourceUrl: HOME, updatedAt: U,
  },

  // ─── חינוך, צעירים ופסיכולוגיה ───
  {
    id: 'rh-education', deptName: 'מינהל החינוך והקב"ס', group: 'חינוך, צעירים ופסיכולוגיה',
    days: SUN_THU, hoursText: 'א\' 08:00-12:00 וגם 16:00-18:00 · ב\' 13:00-16:00 (קהל בלבד) · ג\'-ה\' 08:00-12:00',
    contacts: [
      { name: 'אושרת מלכה', role: 'מנהלת אגף החינוך', phone: '04-6507789' },
      { name: 'נעמה פרץ', role: 'אדמיניסטרציה ורישום (בירורים: 04-6507790)', email: 'naamap@migdal-haemeq.muni.il' },
      { name: 'קציני ביקור סדיר', role: 'היחידה לביקור סדיר', email: 'tikiafr@gmail.com' },
    ],
    phone: '04-6507789', location: 'הניצנים 39, קומה ב\', מגדל העמק', sourceUrl: EDUCATION, updatedAt: U,
  },
  {
    id: 'rh-shefach', deptName: 'שירות פסיכולוגי חינוכי (שפ"ח)', group: 'חינוך, צעירים ופסיכולוגיה',
    days: SUN_THU, hoursText: '07:30-15:30',
    contacts: [{ name: 'אוולין', role: 'מזכירת השירות הפסיכולוגי', phone: '04-6541564', email: 'evlinov@migdal-haemeq.muni.il' }],
    phone: '04-6541564', location: 'אלה 2, מגדל העמק', sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-youth', deptName: 'אגף צעירים ונוער', group: 'חינוך, צעירים ופסיכולוגיה',
    days: ['ראשון', 'שלישי', 'רביעי'], hoursText: 'א\' 08:00-14:00 וגם 16:00-19:00 · ג\' 08:00-17:00 · ד\' 08:00-16:00',
    notes: 'בתיאום מראש · וואטסאפ: 052-5239848',
    contacts: [
      { name: 'יפה זייף בוחבוט', role: 'מנהלת מרכז הצעירים', phone: '04-6507888' },
      { name: 'ויקי גולדנברג', role: 'מזכירת המרכז לפיתוח הון אנושי', email: 'viki@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507888', location: 'עצמון 23, מגדל העמק', sourceUrl: HOME, updatedAt: U,
  },

  // ─── ביטחון, אכיפה, וטרינריה ודת ───
  {
    id: 'rh-pikuah', deptName: 'פיקוח, שיטור עירוני ותנועה', group: 'ביטחון, אכיפה, וטרינריה ודת',
    days: ['ראשון', 'חמישי'], hoursText: 'א\' 09:00-12:00 וגם 16:00-17:00 · ה\' 09:00-12:00',
    phoneHoursText: 'מענה טלפוני: א\', ג\', ה\' 12:00-14:00 · ב\', ד\' 08:00-10:00',
    contacts: [
      { name: 'בוריס נמירובסקי', role: 'מנהל אגף פיקוח' },
      { name: 'סילביה ממן', role: 'מזכירת האגף', phone: '04-6507847', email: 'silviama@migdal-haemeq.muni.il' },
    ],
    phone: '04-6507847', location: 'קרן היסוד 34, מגדל העמק', sourceUrl: TRAFFIC, updatedAt: U,
  },
  {
    id: 'rh-security', deptName: 'ביטחון וחירום', group: 'ביטחון, אכיפה, וטרינריה ודת',
    days: [], hoursText: 'בתיאום מראש',
    contacts: [{ name: 'מוטי אבקסיס', role: 'קב"ט עירוני וממונה חירום', phone: '04-6507828' }],
    phone: '04-6507828', location: 'הניצנים 39, בניין הביטוח הלאומי, קומה 1', sourceUrl: EMERGENCY, updatedAt: U,
  },
  {
    id: 'rh-vet', deptName: 'השירות הווטרינרי', group: 'ביטחון, אכיפה, וטרינריה ודת',
    days: [], hoursText: 'קבלת קהל בזימון תור מקוון מראש בלבד',
    contacts: [{ name: 'ד"ר ג\'ליל חרבוש', role: 'וטרינר עירוני', phone: '04-6507805 · נייד: 058-4120394' }],
    phone: '04-6507805', location: 'צאלון 5, מגדל העמק', sourceUrl: HOME, updatedAt: U,
  },
  {
    id: 'rh-religion', deptName: 'מועצה דתית והרבנות', group: 'ביטחון, אכיפה, וטרינריה ודת',
    days: SUN_THU, hoursText: 'מנהלה: א\'-ה\' 08:00-13:00 · רבנות: א\'-ה\' 11:00-13:00, וביום א\' גם 16:00-18:00',
    contacts: [{ name: 'רבני העיר', role: 'המועצה הדתית' }],
    location: 'העצמאות 39, מגדל העמק', sourceUrl: HOME, updatedAt: U,
  },
];
