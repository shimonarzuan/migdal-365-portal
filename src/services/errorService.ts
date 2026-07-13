import type { AppErrorKind } from '@/types';
import { logger } from './logger';

/**
 * ─── errorService — טיפול שגיאות אחיד ───────────────────────────────────────
 * ממפה כל שגיאה ל-AppError עם סוג ברור והודעה ידידותית למשתמש,
 * בלי לחשוף פרטים טכניים או מידע רגיש.
 */

export class AppError extends Error {
  kind: AppErrorKind;
  cause?: unknown;
  constructor(kind: AppErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.cause = cause;
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const kindOf = (): AppErrorKind => {
    if (err && typeof err === 'object' && 'kind' in err && (err as { kind: string }).kind === 'permission') return 'permission';
    if (/InteractionRequired|login|token|account/i.test(msg)) return 'auth';
    if (/graph|sharepoint|odata/i.test(msg)) return 'graph';
    if (/network|fetch|timeout|Failed to fetch/i.test(msg)) return 'network';
    if (/validation|required|invalid/i.test(msg)) return 'validation';
    return 'unknown';
  };
  return new AppError(kindOf(), msg, err);
}

/** הודעה ידידותית למשתמש — ללא פרטים טכניים */
export function userMessage(err: unknown): string {
  const e = toAppError(err);
  switch (e.kind) {
    case 'auth': return 'פג תוקף ההתחברות — יש להתחבר מחדש.';
    case 'permission': return 'אין לך הרשאה לבצע פעולה זו.';
    case 'graph': return 'שגיאה בתקשורת עם Microsoft 365. נסו שוב.';
    case 'network': return 'בעיית רשת — בדקו את החיבור ונסו שוב.';
    case 'validation': return 'הנתונים שהוזנו אינם תקינים.';
    default: return 'אירעה שגיאה בלתי צפויה. נסו שוב או פנו למערכות מידע.';
  }
}

/** רישום + החזרת הודעה למשתמש — לשימוש ב-catch */
export function handleError(err: unknown, context: string): string {
  const e = toAppError(err);
  logger.error(`${context}: ${e.kind}`, e.message);
  return userMessage(e);
}
