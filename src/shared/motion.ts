import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * ─── Motion Design System — מקור אמת יחיד לטוקנים ────────────────────────────
 * משכים ועקומות בשימוש בכל הפורטל — הן ב-Framer (כאן, כמספרים) והן ב-CSS
 * (`styles.css` :root, כ-ms). שני המקורות חייבים להישאר מסונכרנים ידנית —
 * ראו הערה מקבילה שם. שינוי משך/עקומה → לעדכן בשני המקומות יחד.
 */
export const motionTokens = {
  duration: { fast: 0.15, base: 0.22, slow: 0.32 },   // שניות — ל-Framer
  ease: {
    out: [0.16, 1, 0.3, 1] as const,      // האטה — Fluent-style decelerate
    standard: [0.4, 0, 0.2, 1] as const,  // מעבר סטנדרטי
  },
};

// Re-export נקודת-כניסה יחידה ל-Framer — צרכנים מייבאים מכאן, לא ישירות מ-motion/react
export { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';

/** משכי אנימציה בטוחים — מתאפסים אוטומטית כש-prefers-reduced-motion פעיל */
export function useMotionSafe() {
  const reduced = useReducedMotion();
  return {
    reduced,
    duration: reduced
      ? { fast: 0, base: 0, slow: 0 }
      : motionTokens.duration,
    transition: (dur: keyof typeof motionTokens.duration = 'base') => ({
      duration: reduced ? 0 : motionTokens.duration[dur],
      ease: motionTokens.ease.out,
    }),
  };
}

/**
 * ספירה עולה טהורה (RAF, ללא תלות ב-Framer) — לערכי KPI. מתאפסת מיידית
 * (ללא אנימציה) כש-prefers-reduced-motion פעיל.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const reducedRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reducedRef.current || prevTarget.current === target) {
      setValue(target);
      prevTarget.current = target;
      return;
    }
    const from = prevTarget.current;
    const delta = target - from;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — תואם עקומת ease.out
      setValue(Math.round(from + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    prevTarget.current = target;
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
