import { useMemo } from 'react';
import { useData, usePendingSignatures, usePendingRsDocuments } from '@/shared/DataContext';
import { Badge } from '@/shared/ui';
import { Icon, FolderClosed, FileSignature, ChevronLeft } from '@/shared/icons';
import type { PageId } from '@/portal/layout/Sidebar';

const DAY_MS = 86_400_000;
const isRecent = (d?: string) => !!d && Date.now() - new Date(d).getTime() <= 14 * DAY_MS;

/** אזור נהלים + קרא וחתום — שני כרטיסי טיפול נקיים. */
export default function HomeProceduresAndSign({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { data, canSeeInternal, user } = useData();
  const pendingSig = usePendingSignatures();
  const pendingDocs = usePendingRsDocuments();
  const docsToSign = pendingSig.length + pendingDocs.length;

  const proc = useMemo(() => {
    const visible = data.procedures.filter((p) => canSeeInternal(p.deptId) || !p.internal);
    const recent = visible.filter((p) => isRecent(p.createdAt));
    const latest = [...visible].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
    const myDept = visible.filter((p) => p.deptId === user.deptId).length;
    return { total: visible.length, newCount: recent.length, latest, myDept };
  }, [data.procedures, canSeeInternal, user.deptId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* נהלים */}
      <button onClick={() => onNavigate('procedures')}
              className="group text-right rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--dur-fast)] cursor-pointer flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <span className="shrink-0 grid place-items-center size-10 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden><Icon icon={FolderClosed} size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-semibold text-[var(--text)]">נהלים</strong>
              {proc.newCount > 0 && <Badge tone="success">{proc.newCount} חדשים</Badge>}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">נהלים ארגוניים ומקצועיים לפי אגף ומחלקה</p>
          </div>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] ps-[52px] space-y-0.5">
          {proc.total > 0 ? (
            <>
              {proc.latest && <span className="block truncate">אחרון: {proc.latest.title}</span>}
              {proc.myDept > 0 && <span className="block">{proc.myDept} נהלים באגף שלך</span>}
            </>
          ) : <span className="block">טרם נוספו נהלים</span>}
        </div>
        <span className="ps-[52px] text-xs text-[var(--primary)] flex items-center gap-0.5 group-hover:underline">לכל הנהלים <Icon icon={ChevronLeft} size={13} /></span>
      </button>

      {/* קרא וחתום — הדגשה רק כשיש פעולה ממתינה */}
      <button onClick={() => onNavigate('readsign')}
              className={`group text-right rounded-[var(--radius-lg)] border p-4 transition-all duration-[var(--dur-fast)] cursor-pointer flex flex-col gap-2 hover:shadow-[var(--shadow-md)]
                ${docsToSign > 0
                  ? 'border-[var(--warning)]/50 bg-[var(--warning-bg)] hover:border-[var(--warning)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]'}`}>
        <div className="flex items-start gap-3">
          <span className={`shrink-0 grid place-items-center size-10 rounded-[var(--radius-md)] ${docsToSign > 0 ? 'bg-[var(--warning)]/15 text-[var(--warning-text)]' : 'bg-[var(--accent)] text-[var(--primary)]'}`} aria-hidden><Icon icon={FileSignature} size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-semibold text-[var(--text)]">קרא וחתום</strong>
              {docsToSign > 0 && <Badge tone="warning">{docsToSign === 1 ? 'מסמך אחד ממתין' : `${docsToSign} מסמכים ממתינים`}</Badge>}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">מסמכים והנחיות הממתינים לאישור</p>
          </div>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] ps-[52px]">
          {docsToSign > 0 ? 'ממתינים לקריאה ואישור שלך' : 'אין מסמכים הממתינים לחתימה'}
        </div>
        <span className="ps-[52px] text-xs text-[var(--primary)] flex items-center gap-0.5 group-hover:underline">למסמכים שלי <Icon icon={ChevronLeft} size={13} /></span>
      </button>
    </div>
  );
}
