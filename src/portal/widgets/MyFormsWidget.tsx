import { useMemo } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel, Badge } from '@/shared/ui';
import { Icon, FileText } from '@/shared/icons';
import { mySubmissions } from '@/services/formService';
import { formById } from '@/services/formsService';
import type { PageId } from '@/portal/layout/Sidebar';
import type { FormSubmissionStatus } from '@/types';

const fmtDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');

const STATUS_META: Record<FormSubmissionStatus, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'בטיפול', tone: 'warning' },
  approved: { label: 'אושר', tone: 'success' },
  rejected: { label: 'נדחה', tone: 'danger' },
};

const PREVIEW_COUNT = 3;

/** תמצית "הטפסים שלי" לדף הבית — אותה לוגיקה כמו FormsPage, Top 3 בלבד */
export default function MyFormsWidget({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { data, user } = useData();
  const submissions = useMemo(() => mySubmissions(data.formSubmissions, user.id).slice(0, PREVIEW_COUNT), [data.formSubmissions, user.id]);

  return (
    <Panel title="הטפסים שלי" icon={<Icon icon={FileText} size={15} />}
           action={<button onClick={() => onNavigate('forms')} className="text-xs text-[var(--primary)] hover:underline cursor-pointer">כל הטפסים ←</button>}>
      {submissions.length === 0
        ? <div className="py-6 flex flex-col items-center gap-1.5 text-center"><Icon icon={FileText} size={22} className="text-[var(--text-muted)]" /><p className="text-xs text-[var(--text-muted)]">טרם הגשת טפסים</p></div>
        : (
          <ul className="space-y-1.5">
            {submissions.map((s) => {
              const form = formById(data.formDefinitions, s.formId);
              const meta = STATUS_META[s.status];
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2">
                  <span className="min-w-0">
                    <strong className="block text-xs text-[var(--text)] truncate">{form?.title ?? s.formId}</strong>
                    <small className="text-[11px] text-[var(--text-muted)]">עודכן {fmtDate(s.decidedAt ?? s.submittedAt)}</small>
                  </span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
    </Panel>
  );
}
