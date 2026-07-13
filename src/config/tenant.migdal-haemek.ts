import type { TenantConfig } from '@/types';

/**
 * ─── קובץ הקונפיגורציה של הרשות ─────────────────────────────────────────────
 * מיתוג, צבעים ומערכות של עיריית מגדל העמק.
 * אנשים ואגפים מגיעים מנתוני האמת ב-src/data/employees.ts (מתוך האלפון).
 * להקמת פורטל לרשות אחרת — מחליפים קובץ זה + קובץ אלפון.
 */
export const tenant: TenantConfig = {
  tenantId: 'migdal-haemek',
  productName: 'Migdal 365',
  municipalityName: 'עיריית מגדל העמק',
  logoUrl: '/logo.svg', // וקטורי וחד; להחלפה בלוגו הרשמי: שמרו קובץ באותו שם
  logoFallbackEmoji: '🏛️',
  // פלטת המותג של עיריית מגדל העמק — טורקיז עירוני. הצבעים מוזרקים כ-CSS
  // Variables ב-AppShell ומנקזים לכל הטוקנים הסמנטיים ב-styles.css.
  colors: {
    primary: '#2A9090',
    primaryDark: '#1B6B6B',
    accent: '#e2f1f1',
  },

  mayor: {
    mayorName: 'ראש העיר',
    title: 'דבר ראש העיר',
    body: 'עובדות ועובדים יקרים, אתם הפנים של העירייה והכוח המניע של העיר. הפורטל החדש נועד להקל עליכם — כל המידע, הנהלים והמערכות במקום אחד. בהצלחה לכולנו!',
    date: '2026-07-01',
  },

  weather: { city: 'מגדל העמק', tempC: 29, icon: '☀️', text: 'בהיר' },

  citySystems: [
    { id: 'sys-moked', title: 'מוקד עירוני (CRM)', url: 'https://mgh.focuscrmc.com/Login/LoginPage.aspx', icon: '📞' },
    { id: 'sys-gis', title: 'מערכת GIS', url: 'https://v5.gis-net.co.il/v5/Migdal_Haemek', icon: '🗺️' },
    { id: 'sys-3d', title: 'סימפלקס תלת־ממד', url: 'https://simplex-smart3d.com/ces/migdal-haemek/app-muni/', icon: '🏙️' },
    { id: 'sys-helpdesk', title: 'קריאות שירות מחשוב', url: 'https://helpdesk-migdal-haemeq.vercel.app/', icon: '🛠️' },
  ],

  integrations: {
    entraIdTenant: undefined,
    graphApiBase: undefined,
    aiEndpoint: undefined,
  },
};
