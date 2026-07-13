import { useEffect, useState } from 'react';
import type { Employee } from '@/types';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { isMsalMode } from '@/services/config';
import { LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { Icon, Phone, Mail, MessagesSquare, Copy, MapPin, Calendar, UserRound, ChevronLeft, type LucideIcon } from '@/shared/icons';
import { deptColor } from './deptColors';

const fmtDate = (d: string) => d.split('-').reverse().join('/');

/**
 * כרטיס עובד — Breadcrumb ארגוני, תמונה מ-Graph, פרטי קשר מלאים,
 * כפתורי פעולה מובחנים בצבע וכפיפים ישירים. אייקוני Lucide בלבד.
 */
export default function EmployeeCard({ emp, onSelect, onOpenEmployee, childrenOf }: {
  emp: Employee;
  onSelect: (id: string) => void;
  onOpenEmployee: (id: string) => void;
  childrenOf: (id: string) => Employee[];
}) {
  const { data } = useData();
  const toast = useToast();
  const [photo, setPhoto] = useState<string | null>(null);

  const dept = data.departments.find((d) => d.id === emp.deptId);
  const manager = emp.managerId ? data.employees.find((e) => e.id === emp.managerId) : null;
  const reports = childrenOf(emp.id);
  const color = deptColor(emp.deptId);

  const chain: Employee[] = [];
  let cur: Employee | null | undefined = manager;
  const seen = new Set<string>([emp.id]);
  while (cur && !seen.has(cur.id) && chain.length < 6) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.managerId ? data.employees.find((e) => e.id === cur!.managerId) : null;
  }

  useEffect(() => {
    setPhoto(null);
    if (!isMsalMode) return;
    let alive = true;
    import('@/services/graphService')
      .then(({ getUserPhoto }) => getUserPhoto(emp.id))
      .then((url) => { if (alive) setPhoto(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [emp.id]);

  const copyDetails = () => {
    const lines = [emp.name, emp.title, dept ? `אגף ${dept.name}` : '', emp.office && `משרד: ${emp.office}`,
      emp.mobile && `נייד: ${emp.mobile}`, emp.ext && `שלוחה: ${emp.ext}`, emp.email && `דוא"ל: ${emp.email}`]
      .filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines)
      .then(() => toast.success('פרטי העובד הועתקו ללוח'))
      .catch(() => toast.error('ההעתקה נכשלה'));
  };

  const hasPhone = Boolean(emp.mobile || emp.ext);
  const hasEmail = Boolean(emp.email);

  const actionCls = 'flex-1 min-w-28 flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm py-2.5 font-medium transition-all duration-[var(--dur-fast)]';
  const disabledCls = `${actionCls} bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-not-allowed`;

  return (
    <LazyMotion features={domAnimation}>
    <article className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden animate-[fadeIn_.2s_ease]"
             aria-label={`כרטיס עובד: ${emp.name}`}>
      <div className="h-1.5" style={{ background: color }} />
      <div className="p-6 sm:p-8">

        {/* Breadcrumb ארגוני */}
        <nav className="mb-5 text-xs text-[var(--text-muted)] leading-relaxed" aria-label="מיקום במבנה הארגוני">
          {dept && (
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
              אגף {dept.name}
            </span>
          )}
          {chain.map((mgr) => (
            <span key={mgr.id} className="block mr-3">
              <Icon icon={ChevronLeft} size={12} className="inline align-middle text-[var(--border-strong)]" />
              <button onClick={() => onSelect(mgr.id)} className="text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline cursor-pointer">{mgr.name}</button>
              {mgr.title && <span className="text-[var(--text-muted)]"> · {mgr.title}</span>}
            </span>
          ))}
          <span className="block mr-3 font-semibold text-[var(--text-secondary)]"><Icon icon={ChevronLeft} size={12} className="inline align-middle text-[var(--border-strong)]" />{emp.name}</span>
        </nav>

        {/* כותרת: תמונה + שם + תפקיד + אגף */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {photo
            ? <m.img key={photo} src={photo} alt={emp.name} className="size-24 rounded-[var(--radius-xl)] object-cover shadow-[var(--shadow-md)]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }} />
            : <div className="size-24 shrink-0 rounded-[var(--radius-xl)] grid place-items-center text-3xl font-bold text-white shadow-[var(--shadow-md)]"
                   style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                {emp.firstName[0] ?? ''}{emp.lastName[0] ?? ''}
              </div>}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-[var(--text)]">{emp.name}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{emp.title || 'ללא הגדרת תפקיד'}</p>
            {dept && (
              <m.span key={emp.id}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: motionTokens.duration.base, ease: [0.34, 1.56, 0.64, 1] }}
                className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium rounded-full px-3 py-1.5"
                style={{ background: `${color}14`, color }}>
                <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
                אגף {dept.name}
              </m.span>
            )}
          </div>
        </div>

        {/* כפתורי פעולה מובחנים */}
        <div className="flex gap-2.5 flex-wrap mt-6">
          {hasPhone ? (
            <a href={`tel:${emp.mobile || emp.ext}`} className={`${actionCls} bg-[var(--success)] hover:brightness-95 text-white`}>
              <Icon icon={Phone} size={16} />התקשר
            </a>
          ) : <span className={disabledCls} aria-disabled><Icon icon={Phone} size={16} />התקשר</span>}
          {hasEmail ? (
            <a href={`mailto:${emp.email}`} className={`${actionCls} bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white`}>
              <Icon icon={Mail} size={16} />שלח מייל
            </a>
          ) : <span className={disabledCls} aria-disabled><Icon icon={Mail} size={16} />מייל</span>}
          {hasEmail ? (
            <a href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(emp.email)}`} target="_blank" rel="noreferrer"
               className={`${actionCls} text-white hover:brightness-95`} style={{ background: '#6264A7' }}>
              <Icon icon={MessagesSquare} size={16} />Teams
            </a>
          ) : <span className={disabledCls} aria-disabled title="אין כתובת מייל — Teams אינו זמין"><Icon icon={MessagesSquare} size={16} />Teams</span>}
          <button onClick={copyDetails}
                  className={`${actionCls} border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary-dark)] cursor-pointer`}>
            <Icon icon={Copy} size={16} />העתק פרטים
          </button>
        </div>

        {/* פרטי קשר */}
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mt-7 text-sm">
          {emp.ext && <Row label="טלפון פנימי" value={emp.ext} href={`tel:${emp.ext}`} icon={Phone} />}
          {emp.mobile && <Row label="טלפון נייד" value={emp.mobile} href={`tel:${emp.mobile}`} icon={Phone} />}
          {emp.email && <Row label='כתובת מייל' value={emp.email} href={`mailto:${emp.email}`} icon={Mail} />}
          {emp.office && <Info label="משרד / מיקום" value={emp.office} icon={MapPin} />}
          {emp.startDate && <Info label="תחילת עבודה" value={fmtDate(emp.startDate)} icon={Calendar} />}
          <div className="flex items-start gap-2.5">
            <Icon icon={UserRound} size={17} className="mt-0.5 text-[var(--text-muted)]" />
            <div>
              <dt className="text-xs text-[var(--text-muted)] mb-0.5">מנהל/ת ישיר/ה</dt>
              <dd>
                {manager
                  ? <button onClick={() => onSelect(manager.id)} className="text-[var(--primary)] hover:underline cursor-pointer">{manager.name}</button>
                  : <span className="text-[var(--text-secondary)]">{emp.managerName || '—'}</span>}
              </dd>
            </div>
          </div>
        </dl>

        {/* עובדים המדווחים */}
        {reports.length > 0 && (
          <div className="mt-7 pt-5 border-t border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-3">עובדים המדווחים ({reports.length})</h3>
            <div className="flex flex-wrap gap-2">
              {reports.map((r) => (
                <button key={r.id} onClick={() => onSelect(r.id)}
                        className="flex items-center gap-2 text-xs bg-[var(--surface-sunken)] hover:bg-[var(--accent)] border border-[var(--border)] rounded-full pr-1.5 pl-3.5 py-1.5 text-[var(--text-secondary)] hover:-translate-y-px transition-all duration-[var(--dur-fast)] cursor-pointer">
                  <span className="size-6 grid place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: deptColor(r.deptId) }}>
                    {r.firstName[0] ?? ''}{r.lastName[0] ?? ''}
                  </span>
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-left">
          <button onClick={() => onOpenEmployee(emp.id)} className="text-xs text-[var(--primary)] hover:underline cursor-pointer inline-flex items-center gap-0.5">
            לדף העובד המלא (משימות ועוד) <Icon icon={ChevronLeft} size={13} />
          </button>
        </div>
      </div>
    </article>
    </LazyMotion>
  );
}

function Row({ label, value, href, icon }: { label: string; value: string; href: string; icon: LucideIcon }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon icon={icon} size={17} className="mt-0.5 text-[var(--text-muted)]" />
      <div className="min-w-0">
        <dt className="text-xs text-[var(--text-muted)] mb-0.5">{label}</dt>
        <dd><a href={href} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors break-all" dir="ltr">{value}</a></dd>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon icon={icon} size={17} className="mt-0.5 text-[var(--text-muted)]" />
      <div>
        <dt className="text-xs text-[var(--text-muted)] mb-0.5">{label}</dt>
        <dd className="text-[var(--text-secondary)]">{value}</dd>
      </div>
    </div>
  );
}
