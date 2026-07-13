import { useId } from 'react';
import { m, motionTokens } from './motion';

/**
 * טבעת התקדמות מונפשת (SVG) — "ציור" המסלול דרך `pathLength` המובנה של
 * Framer. חריגה מודעת ומצומצמת לכלל "transform/opacity בלבד": טבעת התקדמות
 * מטבעה דורשת אנימציית stroke, וזו קטגוריה נפרדת שהוגדרה מראש (Circular
 * Progress) בדרישות מערכת התנועה. יש לעטוף בקומפוננטת ההורה ב-`<LazyMotion
 * features={domAnimation}>` (לא כאן, כדי לא לשכפל את ה-Provider בכל מופע).
 */
export default function CircularProgress({ value, label, sublabel, color = 'var(--primary)', size = 84, strokeWidth = 8 }: {
  value: number; // 0–100
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const id = useId();
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }} aria-label={label ? `${label}: ${Math.round(clamped)} אחוז` : undefined}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--accent, #e5edf7)" strokeWidth={strokeWidth} />
          <m.circle
            key={id}
            cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clamped / 100 }}
            transition={{ duration: motionTokens.duration.slow * 2, ease: motionTokens.ease.out }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-base font-extrabold" style={{ color }}>
          {Math.round(clamped)}%
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-slate-700 text-center">{label}</span>}
      {sublabel && <span className="text-[10px] text-slate-400 text-center">{sublabel}</span>}
    </div>
  );
}
