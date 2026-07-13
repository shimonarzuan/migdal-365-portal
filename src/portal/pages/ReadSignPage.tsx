import { useData, usePendingSignatures, usePendingRsDocuments } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { Badge, Empty, Panel, PageHeader } from '@/shared/ui';
import { Icon, FileSignature } from '@/shared/icons';
import { buildApproval } from '@/services/readAndSignService';

/** עמוד קרא וחתום — כל המסמכים המחייבים של המשתמש */
export default function ReadSignPage() {
  const { data, sign, hasSigned, canSeeInternal, user, upsert, audit } = useData();
  const toast = useToast();
  const pending = usePendingSignatures();
  const pendingDocs = usePendingRsDocuments();
  const myApprovals = data.rsApprovals.filter((a) => a.employeeId === user.id);

  const approveDoc = (documentId: string, title: string) => {
    upsert('rsApprovals', buildApproval(documentId, user.id));
    audit('signed', 'rsDocument', documentId, null, { by: user.id });
    toast.success(`אישרת: ${title}`);
  };
  const signedList = data.procedures
    .filter((p) => p.requiresReadAndSign && hasSigned(p.id))
    .filter((p) => canSeeInternal(p.deptId) || !p.internal);

  return (
    <div className="space-y-4">
      <PageHeader title="קרא וחתום" icon={<Icon icon={FileSignature} size={20} />} subtitle="מסמכים ונהלים המחייבים את קריאתך ואישורך" />

      {/* מסמכי Workflow שהוקצו לעובד */}
      <Panel title="מסמכים שהוקצו לך" action={<Badge tone={pendingDocs.length ? 'warning' : 'success'}>{pendingDocs.length}</Badge>}>
        {pendingDocs.length === 0 && <Empty text="אין מסמכים חדשים לחתימה." />}
        <ul className="space-y-2">
          {pendingDocs.map(({ document: d }) => (
            <li key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2.5">
              <span className="flex-1 min-w-0">
                <strong className="block text-sm text-[var(--text)]">{d.title}</strong>
                <small className="text-xs text-[var(--text-muted)]">{d.description} · עד {d.dueDate.slice(5).split('-').reverse().join('/')}</small>
              </span>
              <div className="flex gap-2 shrink-0">
                {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer"
                                 className="text-xs border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2">קריאה</a>}
                <button onClick={() => approveDoc(d.id, d.title)}
                        className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">קראתי ואישרתי ✓</button>
              </div>
            </li>
          ))}
        </ul>
        {myApprovals.length > 0 && (
          <p className="text-xs text-[var(--success-text)] mt-2">✓ אישרת {myApprovals.length} מסמכים</p>
        )}
      </Panel>

      <Panel title="נהלים הממתינים לחתימתך" action={<Badge tone={pending.length ? 'warning' : 'success'}>{pending.length}</Badge>}>
        {pending.length === 0 && <Empty text="אין מסמכים ממתינים — כל הכבוד! ✅" />}
        <ul className="space-y-2">
          {pending.map((p) => (
            <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2.5">
              <span className="flex-1 min-w-0">
                <strong className="block text-sm text-[var(--text)]">{p.title}</strong>
                <small className="text-xs text-[var(--text-muted)]">{p.dept?.icon} {p.dept?.name} · עודכן {p.updatedAt}</small>
              </span>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => alert(`פתיחת קובץ: ${p.title} (דמו)`)}
                        className="text-xs border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2 cursor-pointer">קריאה</button>
                <button onClick={() => sign(p.id)}
                        className="text-xs bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-3 py-2 transition-colors cursor-pointer">קראתי ואישרתי ✓</button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="נחתמו על ידך" action={<Badge tone="success">{signedList.length}</Badge>}>
        {signedList.length === 0 && <Empty text="טרם חתמת על מסמכים." />}
        <ul className="space-y-1.5">
          {signedList.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm rounded-[var(--radius-md)] bg-[var(--success-bg)] border border-[var(--success)]/20 px-3 py-2">
              <span className="text-[var(--text-secondary)]">{p.title}</span>
              <Badge tone="success">✓ נחתם</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
