import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
} from '@azure/msal-browser';
import { envConfig, isMsalMode } from './config';

/**
 * ─── authService — Microsoft Entra ID בלבד ──────────────────────────────────
 * OAuth 2.0 + OpenID Connect דרך MSAL הרשמית. אין מימוש OAuth ידני,
 * אין שמות משתמש/סיסמאות, אין Tokens ב-LocalStorage (sessionStorage בלבד),
 * וחידוש Tokens מתבצע אוטומטית (acquireTokenSilent).
 */

export const loginRequest = {
  // תואם להרשאות ה-Delegated שאושרו ב-App Registration (Admin Consent)
  scopes: [
    'openid', 'profile', 'email', 'offline_access',
    'User.Read', 'User.Read.All', 'User.ReadBasic.All',
    'GroupMember.Read.All', 'People.Read',
    // כתיבה (לא רק קריאה) — נדרשת כדי שהאוספים (קרא-וחתום/לומדה/טפסים/יומן
    // ביקורת) יישמרו בפועל ברשימות SharePoint ולא רק ב-cache מקומי.
    // דורש Admin Consent נוסף ב-App Registration (ראו docs/production-deployment.md).
    'Sites.ReadWrite.All', 'Files.ReadWrite',
  ],
};

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: envConfig.clientId,
    authority: `https://login.microsoftonline.com/${envConfig.tenantId}`,
    redirectUri: envConfig.redirectUri,
    postLogoutRedirectUri: envConfig.redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage', // ⚠️ לא localStorage — דרישת אבטחה
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      // אין להדפיס PII או Tokens ללוג
      loggerCallback: (_level, message, containsPii) => {
        if (!containsPii && import.meta.env.DEV) console.debug('[MSAL]', message);
      },
      piiLoggingEnabled: false,
    },
  },
});

export function getActiveAccount(): AccountInfo | null {
  if (!isMsalMode) return null;
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
}

/**
 * Access Token ל-Microsoft Graph — שקט (חידוש אוטומטי),
 * ורק אם נדרשה אינטראקציה: redirect מאובטח.
 */
export async function getAccessToken(): Promise<string> {
  const account = getActiveAccount();
  if (!account) throw new Error('אין חשבון מחובר — נדרשת התחברות Microsoft');
  try {
    const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      // טיפול מאובטח: הפניה מחודשת להתחברות במקום חשיפת השגיאה
      await msalInstance.acquireTokenRedirect({ ...loginRequest, account });
      throw new Error('נדרשת התחברות מחדש');
    }
    throw err;
  }
}

export async function login(): Promise<void> {
  await msalInstance.loginRedirect(loginRequest);
}

export async function logout(): Promise<void> {
  await msalInstance.logoutRedirect({ account: getActiveAccount() });
}
