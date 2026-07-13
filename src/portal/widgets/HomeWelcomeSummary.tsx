import { useData, usePendingSignatures, usePendingRsDocuments } from '@/shared/DataContext';
import { pendingForApprover } from '@/services/formService';
import { greeting, gregorianDate } from '@/shared/dates';
import { Icon, FileSignature, ClipboardCheck, Cake, type LucideIcon } from '@/shared/icons';
import type { PageId } from '@/portal/layout/Sidebar';

type Chip = { id: string; icon: LucideIcon; text: string; color: string; page?: PageId };

/**
 * אזור ברכה קומפקטי + Chips סטטוס — נתוני אמת בלבד.
 * Chip מוצג רק כאשר יש לו ערך (>0); אין מוני-אפס. אין מזג אוויר (אין מקור אמת מחובר).
 */
export default function HomeWelcomeSummary({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { user, userDept, data } = useData();
  const pendingSig = usePendingSignatures();
  const pendingDocs = usePendingRsDocuments();

  const docsToSign = pendingSig.length + pendingDocs.length;
  const pendingApprovals = pendingForApprover(data.formSubmissions, data.formDefinitions, data.employees, user.id).length;

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const birthdaysToday = data.birthdays.filter((b) => {
    const [d, m] = b.date.split('/');
    return d?.padStart(2, '0') === dd && m?.padStart(2, '0') === mm;
  }).length;

  const chips: Chip[] = [];
  if (docsToSign > 0) chips.push({ id: 'sign', icon: FileSignature, color: '#ea580c', page: 'readsign', text: docsToSign === 1 ? 'מסמך אחד לחתימה' : `${docsToSign} מסמכים לחתימה` });
  if (pendingApprovals > 0) chips.push({ id: 'approvals', icon: ClipboardCheck, color: 'var(--primary)', page: 'forms', text: pendingApprovals === 1 ? 'בקשה אחת לטיפולך' : `${pendingApprovals} בקשות לטיפולך` });
  if (birthdaysToday > 0) chips.push({ id: 'bday', icon: Cake, color: '#7c3aed', text: birthdaysToday === 1 ? 'יום הולדת אחד היום' : `${birthdaysToday} ימי הולדת היום` });

  const subtitle = [user.title, userDept?.name].filter(Boolean).join(' · ');

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-l from-[var(--accent)] via-[var(--surface)] to-[var(--surface)] px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <span aria-hidden className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-[var(--primary)]" />
      <div className="ps-1 min-w-0">
        <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">{greeting()}, {user.name.split(' ')[0]}</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          {subtitle && <span>{subtitle} · </span>}{gregorianDate()}
        </p>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => {
            const inner = (
              <>
                <Icon icon={c.icon} size={15} style={{ color: c.color }} />
                <span className="text-[13px] font-medium text-[var(--text)]">{c.text}</span>
              </>
            );
            const cls = 'inline-flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--border)] ps-2.5 pe-3 py-1.5';
            return c.page ? (
              <button key={c.id} onClick={() => onNavigate(c.page!)} className={`${cls} hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer`}>{inner}</button>
            ) : (
              <span key={c.id} className={cls}>{inner}</span>
            );
          })}
        </div>
      )}
    </section>
  );
}
