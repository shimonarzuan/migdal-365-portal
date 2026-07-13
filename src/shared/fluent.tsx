import { FluentProvider, webLightTheme, type Theme } from '@fluentui/react-components';
import type { ReactNode } from 'react';

/**
 * ─── FluentRTL — תשתית מיגרציה הדרגתית ל-Fluent UI v9 ───────────────────────
 * מדיניות: כל קומפוננטה חדשה נבנית עם Fluent UI; קומפוננטות קיימות עוברות
 * רק כשעורכים אותן. Tailwind נשאר ל-Layout בלבד.
 * העוטף מקומי (לא סביב האפליקציה) — כל מודול Fluent עוטף את עצמו, כך שאין
 * שום השפעה על קומפוננטות קיימות. dir="rtl" מפעיל את מנגנון ה-RTL של Griffel.
 *
 * טוקני משך/עקומה מוצמדים למשתני ה-CSS של Motion Design System (styles.css
 * :root) — כך ש-Button/Dialog/Tab של Fluent מרגישים אחידים עם שאר האתר בלי
 * לשכפל את המספרים בשלישית.
 */
const motionTheme: Theme = {
  ...webLightTheme,
  durationFaster: 'var(--dur-fast)',
  durationFast: 'var(--dur-fast)',
  durationNormal: 'var(--dur-base)',
  durationGentle: 'var(--dur-base)',
  durationSlow: 'var(--dur-slow)',
  curveEasyEase: 'var(--ease-out)',
  curveDecelerateMid: 'var(--ease-out)',
};

export function FluentRTL({ children }: { children: ReactNode }) {
  return (
    <FluentProvider theme={motionTheme} dir="rtl" style={{ background: 'transparent' }}>
      {children}
    </FluentProvider>
  );
}
