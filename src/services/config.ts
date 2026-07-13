/**
 * ─── קונפיגורציית סביבה ─────────────────────────────────────────────────────
 * כל הערכים מגיעים מ-Environment Variables בלבד (.env) — אפס Hardcoding.
 * mock  = פיתוח: נתוני אלפון מקומיים, ללא חיבור ל-Microsoft 365.
 * msal  = ייצור: SSO מלא מול Entra ID + נתוני אמת מ-Graph ו-SharePoint.
 */
export type AuthMode = 'mock' | 'msal';

export const envConfig = {
  authMode: (import.meta.env.VITE_AUTH_MODE ?? 'mock') as AuthMode,
  tenantId: import.meta.env.VITE_TENANT_ID ?? '',
  clientId: import.meta.env.VITE_CLIENT_ID ?? '',
  redirectUri: import.meta.env.VITE_REDIRECT_URI ?? (typeof window !== 'undefined' ? window.location.origin : ''),
  graphEndpoint: import.meta.env.VITE_GRAPH_ENDPOINT ?? 'https://graph.microsoft.com/v1.0',
  sharepointSite: import.meta.env.VITE_SHAREPOINT_SITE ?? '',
  adminUpns: (import.meta.env.VITE_ADMIN_UPNS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
} as const;

export const isMsalMode = envConfig.authMode === 'msal';

/** ולידציה בזמן עלייה — נכשל מוקדם וברור אם חסרה הגדרה בייצור */
export function assertProductionConfig(): void {
  if (!isMsalMode) return;
  const missing = (['tenantId', 'clientId'] as const).filter((k) => !envConfig[k]);
  if (missing.length) {
    throw new Error(`Migdal365: VITE_AUTH_MODE=msal אך חסרות הגדרות: ${missing.map((k) => 'VITE_' + k.replace(/([A-Z])/g, '_$1').toUpperCase()).join(', ')}`);
  }
  if (!envConfig.redirectUri.startsWith('https://') && !envConfig.redirectUri.includes('localhost')) {
    throw new Error('Migdal365: בייצור חובה HTTPS ב-VITE_REDIRECT_URI');
  }
}
