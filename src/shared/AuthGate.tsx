import { useEffect, useState, type ReactNode } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { msalInstance, login } from '@/services/authService';
import { tenant } from '@/config';

/**
 * שער כניסה — Single Sign-On בלבד דרך Microsoft Entra ID.
 * אין טפסי שם-משתמש/סיסמה; ההתחברות כולה ב-login.microsoftonline.com.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    msalInstance.initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((result) => {
        if (result?.account) msalInstance.setActiveAccount(result.account);
        setReady(true);
      })
      .catch(() => setError('ההתחברות נכשלה. נסו שוב או פנו למערכות מידע.')); // ללא חשיפת פרטי שגיאה
  }, []);

  if (error) return <CenterCard><p className="text-red-600 text-sm">{error}</p></CenterCard>;
  if (!ready) return <CenterCard><p className="text-slate-400 text-sm animate-pulse">מאמת התחברות…</p></CenterCard>;

  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate><LoginScreen /></UnauthenticatedTemplate>
    </MsalProvider>
  );
}

function LoginScreen() {
  return (
    <CenterCard>
      <div className="text-center space-y-4">
        {tenant.logoUrl
          ? <img src={tenant.logoUrl} alt={tenant.municipalityName} className="h-16 mx-auto" />
          : <div className="text-5xl">{tenant.logoFallbackEmoji}</div>}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{tenant.productName}</h1>
          <p className="text-sm text-slate-500">פורטל העובדים של {tenant.municipalityName}</p>
        </div>
        <button
          onClick={() => login()}
          className="w-full flex items-center justify-center gap-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
          התחברות עם Microsoft
        </button>
        <p className="text-[11px] text-slate-400">הכניסה בחשבון הארגוני בלבד (SSO) · ללא סיסמאות בפורטל</p>
      </div>
    </CenterCard>
  );
}

function CenterCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[#f0f4f8] p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 w-full max-w-sm">{children}</div>
    </div>
  );
}
