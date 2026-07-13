import type { FormSubmission, FormValue } from '@/types';
import { Icon, Check, X, Clock } from '@/shared/icons';

/** ─── חלקי תצוגה משותפים להגשות — מסך העובד + סקירת הניהול ─── */

/** מסלול הצעדים של הגשה — שרשרת חזותית הוגש → צעדים → הושלם */
export function StepTrail({ s }: { s: FormSubmission }) {
  if (!s.steps?.length) return null;
  return (
    <ol className="flex flex-wrap items-center gap-1 mt-1.5">
      <li className="text-[10px] rounded-full px-2 py-0.5 bg-[var(--surface-sunken)] text-[var(--text-secondary)] flex items-center gap-1"><Icon icon={Check} size={11} /> הוגש</li>
      {s.steps.map((st) => (
        <li key={st.stepId} className={`text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1 ${
          st.status === 'approved' ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
          : st.status === 'rejected' ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
          : 'bg-[var(--warning-bg)] text-[var(--warning-text)]'}`}>
          <Icon icon={st.status === 'approved' ? Check : st.status === 'rejected' ? X : Clock} size={11} /> {st.stepName}
          {st.decidedBy && <span className="text-[var(--text-muted)]">({st.decidedBy})</span>}
        </li>
      ))}
      <li className={`text-[10px] rounded-full px-2 py-0.5 ${s.status === 'approved' ? 'bg-[var(--success-bg)] text-[var(--success-text)] font-bold' : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'}`}>
        הושלם
      </li>
    </ol>
  );
}

/** ערך שדה בתצוגת קריאה — כולל חתימה כתמונה */
export function ValueView({ v, isSignature }: { v: FormValue | undefined; isSignature?: boolean }) {
  if (isSignature) {
    return v ? <img src={String(v)} alt="חתימה" className="h-8 border border-[var(--border)] rounded bg-[var(--surface)]" /> : <>—</>;
  }
  if (typeof v === 'boolean') {
    return <span className="inline-flex items-center gap-1"><Icon icon={v ? Check : X} size={13} className={v ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />{v ? 'כן' : 'לא'}</span>;
  }
  if (Array.isArray(v)) return <>{v.join(', ') || '—'}</>;
  return <>{String(v ?? '—') || '—'}</>;
}
