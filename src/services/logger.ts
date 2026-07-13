/**
 * ─── logger — רישום מרכזי ───────────────────────────────────────────────────
 * development: הדפסה ל-console.
 * production: צבירה בזיכרון + נקודת חיבור מוכנה ל-Application Insights.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry { level: Level; message: string; data?: unknown; timestamp: string }

const buffer: LogEntry[] = [];
const MAX_BUFFER = 200;

function emit(level: Level, message: string, data?: unknown): void {
  const entry: LogEntry = { level, message, data, timestamp: new Date().toISOString() };
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'debug' : level](`[Migdal365] ${message}`, data ?? '');
  } else {
    buffer.push(entry);
    if (buffer.length > MAX_BUFFER) buffer.shift();
    // TODO (שלב פריסה): שליחה ל-Application Insights —
    // appInsights.trackTrace({ message, severityLevel, properties: { data } })
  }
}

export const logger = {
  debug: (m: string, d?: unknown) => emit('debug', m, d),
  info: (m: string, d?: unknown) => emit('info', m, d),
  warn: (m: string, d?: unknown) => emit('warn', m, d),
  error: (m: string, d?: unknown) => emit('error', m, d),
  /** לצורך שליחה עתידית / דיבוג */
  flush: (): LogEntry[] => [...buffer],
};
