import type { ReactNode } from 'react';
import { Icon, Inbox, Search, X, AlertTriangle } from '@/shared/icons';

/* ═══════════════════════════════════════════════════════════════════════════
   ספריית UI משותפת — כל הפרימיטיבים נגזרים מ-Design Tokens (styles.css).
   RTL מלא, focus/hover/disabled states, ללא צבעי hex מפוזרים.
   ═══════════════════════════════════════════════════════════════════════════ */

/** כרטיס קומפקטי — כותרת צמודה, ריווח מדוד, עשיר במידע */
export function Panel({ title, icon, action, children, className = '' }: {
  title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] rounded-t-[var(--radius-lg)]"
                style={{ background: 'color-mix(in srgb, var(--primary) 4%, white)' }}>
          <h2 className="text-sm font-bold text-[var(--primary-dark)] flex items-center gap-2">
            {icon && <span className="text-[var(--primary)]" aria-hidden>{icon}</span>}{title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ─── Badge — טונים סמנטיים מטוקנים (שמות ישנים נשמרים לתאימות אחורה) ─── */
type BadgeTone = 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  | 'blue' | 'green' | 'amber' | 'red' | 'slate';

const BADGE_TONES: Record<BadgeTone, string> = {
  teal: 'bg-[var(--accent)] text-[var(--primary-dark)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  info: 'bg-[var(--info-bg)] text-[var(--info-text)]',
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
  // שמות תאימות אחורה → ממופים לסמנטיים
  blue: 'bg-[var(--accent)] text-[var(--primary-dark)]',
  green: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  amber: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  red: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  slate: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
};

export function Badge({ children, tone = 'teal' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`text-xs rounded-full px-2 py-0.5 whitespace-nowrap font-medium ${BADGE_TONES[tone]}`}>{children}</span>;
}

/* ─── Button — variants מטוקנים, ripple + scale עדין, min touch target ─── */
export function Btn({ children, onClick, variant = 'primary', type = 'button', small = false, disabled = false, loading = false, title, ariaLabel }: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  ariaLabel?: string;
}) {
  const variants = {
    primary: 'relative text-[var(--on-primary)] bg-gradient-to-l from-[var(--primary)] to-[var(--primary-dark)] after:absolute after:inset-0 after:rounded-[var(--radius-md)] after:bg-white after:opacity-0 hover:after:opacity-10 after:transition-opacity after:duration-[var(--dur-fast)]',
    outline: 'border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--surface)] hover:bg-[var(--accent)]',
    ghost: 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
    danger: 'text-[var(--danger-text)] border border-[var(--danger)]/30 bg-[var(--surface)] hover:bg-[var(--danger-bg)]',
  };
  const isOff = disabled || loading;
  return (
    <button type={type} onClick={onClick} disabled={isOff} title={title} aria-label={ariaLabel} aria-busy={loading || undefined}
      className={`ripple-lite inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)]
        ${isOff ? 'opacity-[var(--disabled-opacity)] cursor-not-allowed' : 'cursor-pointer hover:shadow-[var(--shadow-md)] hover:scale-[1.02] active:scale-[0.98]'}
        ${small ? 'text-xs px-2.5 py-1.5 min-h-8' : 'text-sm px-4 py-2 min-h-10'} ${variants[variant]}`}>
      {loading && <Spinner />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

/** ספינר קטן ל-loading states — סיבוב transform בלבד */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />
  );
}

/* ─── PageHeader — כותרת עמוד + תיאור + breadcrumb (RTL) + פעולות ─── */
export function PageHeader({ title, subtitle, icon, breadcrumb, actions }: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  breadcrumb?: { label: string; onClick?: () => void }[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="נתיב ניווט" className="mb-1.5">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
            {breadcrumb.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {c.onClick
                  ? <button onClick={c.onClick} className="hover:text-[var(--primary)] hover:underline cursor-pointer transition-colors">{c.label}</button>
                  : <span aria-current={i === breadcrumb.length - 1 ? 'page' : undefined} className={i === breadcrumb.length - 1 ? 'text-[var(--text-secondary)] font-medium' : ''}>{c.label}</span>}
                {i < breadcrumb.length - 1 && <span aria-hidden className="text-[var(--border-strong)]">‹</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-[var(--text)] flex items-center gap-2 leading-tight">
            {icon && <span aria-hidden className="text-[var(--primary)]">{icon}</span>}{title}
          </h1>
          {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

/** כותרת מקטע פנימית */
export function SectionHeader({ title, icon, action, className = '' }: {
  title: string; icon?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <h2 className="text-sm font-bold text-[var(--primary-dark)] flex items-center gap-2">
        {icon && <span aria-hidden>{icon}</span>}{title}
      </h2>
      {action}
    </div>
  );
}

/* ─── StatCard — כרטיס KPI אחיד: אייקון-בעיגול + ערך + תיאור + מצבים ─── */
export function StatCard({ icon, value, label, sublabel, color = 'var(--primary)', onClick, loading = false }: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sublabel?: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-right bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 flex items-center gap-3 w-full
        ${onClick ? 'ripple-lite cursor-pointer transition-all duration-[var(--dur-base)] ease-[var(--ease-out)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5' : ''}`}
    >
      <span className="size-11 shrink-0 grid place-items-center rounded-full text-xl"
            style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }} aria-hidden>{icon}</span>
      <div className="min-w-0">
        {loading
          ? <span className="skeleton-pulse inline-block h-6 w-10 rounded bg-[var(--surface-sunken)]" aria-hidden />
          : <div className="text-xl font-extrabold text-[var(--text)]">{value}</div>}
        <div className="text-xs text-[var(--text-secondary)] truncate">{label}</div>
        {sublabel && <div className="text-[11px] font-medium" style={{ color }}>{sublabel}</div>}
      </div>
    </Tag>
  );
}

/* ─── SearchInput — קלט חיפוש עם אייקון, ניקוי, RTL ─── */
export function SearchInput({ value, onChange, placeholder = 'חיפוש…', ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <span aria-hidden className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"><Icon icon={Search} size={16} /></span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] ps-9 pe-3 py-2 text-sm
                   placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[var(--focus-ring)] focus:border-[var(--primary)] transition-colors"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="ניקוי חיפוש"
                className="absolute inset-inline-end-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover)] cursor-pointer"><Icon icon={X} size={14} /></button>
      )}
    </div>
  );
}

/** סרגל סינון — עוטף חיפוש + פילטרים בשורה רספונסיבית */
export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-3 ${className}`}>{children}</div>
  );
}

/* ─── מצבים: ריק / שגיאה ─── */
export function Empty({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="py-5 flex flex-col items-center gap-1.5 text-center">
      <span className="text-[var(--text-muted)]" aria-hidden>{icon ?? <Icon icon={Inbox} size={22} />}</span>
      <p className="text-sm text-[var(--text-muted)]">{text}</p>
    </div>
  );
}

/** מצב ריק עשיר — אייקון, כותרת, תיאור, פעולה */
export function EmptyState({ title, description, icon, action }: {
  title: string; description?: string; icon?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="py-10 px-4 text-center flex flex-col items-center gap-2">
      <span className="text-[var(--text-muted)]" aria-hidden>{icon ?? <Icon icon={Inbox} size={30} />}</span>
      <h3 className="text-sm font-bold text-[var(--text-secondary)]">{title}</h3>
      {description && <p className="text-xs text-[var(--text-muted)] max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** מצב שגיאה — עם פעולת התאוששות (retry) */
export function ErrorState({ title = 'משהו השתבש', description, onRetry }: {
  title?: string; description?: string; onRetry?: () => void;
}) {
  return (
    <div role="alert" className="py-10 px-4 text-center flex flex-col items-center gap-2">
      <Icon icon={AlertTriangle} size={30} className="text-[var(--danger)]" />
      <h3 className="text-sm font-bold text-[var(--danger-text)]">{title}</h3>
      {description && <p className="text-xs text-[var(--text-muted)] max-w-xs">{description}</p>}
      {onRetry && <div className="mt-2"><Btn variant="outline" small onClick={onRetry}>נסה שוב</Btn></div>}
    </div>
  );
}

/* ─── שדות טופס ─── */
export function Field({ label, children, required = false, hint, error }: {
  label: string; children: ReactNode; required?: boolean; hint?: string; error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-[var(--text-secondary)] mb-1 font-medium">
        {label}{required && <span className="text-[var(--danger)] ms-0.5" aria-hidden>*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-[var(--text-muted)] mt-1">{hint}</span>}
      {error && <span role="alert" className="block text-xs text-[var(--danger-text)] mt-1">{error}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm bg-[var(--surface)] focus:outline-2 focus:outline-[var(--focus-ring)] focus:border-[var(--primary)] transition-colors';
