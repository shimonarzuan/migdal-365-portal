import { useMemo } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel } from '@/shared/ui';
import { Icon, Activity } from '@/shared/icons';
import { timeAgo } from '@/shared/dates';
import { getAuditLog } from '@/services/auditService';
import { deptColor } from '@/portal/widgets/orgtree/deptColors';

// תוויות ישות (יחיד/רבים — הבדל בין audit() אוטומטי דרך upsert לקריאות ידניות)
const ENTITY_LABEL: Record<string, string> = {
  announcement: 'הודעה', announcements: 'הודעה',
  task: 'משימה', tasks: 'משימה',
  procedure: 'נוהל', procedures: 'נוהל',
  employee: 'עובד', employees: 'עובד',
  department: 'אגף', departments: 'אגף',
  link: 'קישור', links: 'קישור',
  birthday: 'יום הולדת', birthdays: 'יום הולדת',
  rsDocument: 'מסמך קרא וחתום', rsDocuments: 'מסמך קרא וחתום',
  event: 'אירוע', events: 'אירוע',
  employeeRight: 'זכות עובד', employeeRights: 'זכות עובד',
  formSubmission: 'טופס', formSubmissions: 'טופס',
  formDefinition: 'הגדרת טופס', formDefinitions: 'הגדרת טופס',
};

const ACTION_VERB: Record<string, string> = {
  created: 'יצר/ה', updated: 'עדכן/ה', deleted: 'מחק/ה', signed: 'חתם/ה על',
  submitted: 'הגיש/ה', approved: 'אישר/ה', rejected: 'דחה/דחתה',
  published: 'פרסם/ה', unpublished: 'ביטל/ה פרסום של', duplicated: 'שכפל/ה',
  roleChanged: 'עדכן/ה הרשאות של', reminderSent: 'שלח/ה תזכורת על',
};

const initials = (name: string) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('');

const PREVIEW_COUNT = 6;

/** פעילות אחרונה — Timeline הנגזר מיומן הביקורת האמיתי (auditService), לא בדוי */
export default function RecentActivity() {
  const { data } = useData();
  const entries = useMemo(() => getAuditLog().slice(0, PREVIEW_COUNT), []);

  const colorFor = (userId: string) => {
    const emp = data.employees.find((e) => e.id === userId);
    return emp ? deptColor(emp.deptId) : 'var(--primary)';
  };

  return (
    <Panel title="פעילות אחרונה" icon={<Icon icon={Activity} size={15} />}>
      {entries.length === 0 ? (
        <div className="py-6 flex flex-col items-center gap-1.5 text-center">
          <Icon icon={Activity} size={22} className="text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">אין פעילות מתועדת עדיין</p>
        </div>
      ) : (
        <ol className="relative">
          {entries.map((e, i) => {
            const verb = ACTION_VERB[e.action] ?? e.action;
            const label = ENTITY_LABEL[e.entityType] ?? e.entityType;
            const color = colorFor(e.userId);
            const last = i === entries.length - 1;
            return (
              <li key={e.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                {/* קו ה-Timeline */}
                {!last && <span aria-hidden className="absolute top-7 bottom-0 inset-inline-start-[13px] w-px bg-[var(--border)]" />}
                <span className="relative z-10 size-7 shrink-0 rounded-full grid place-items-center text-[10px] font-bold text-white ring-2 ring-[var(--surface)]"
                      style={{ background: color }} aria-hidden>
                  {initials(e.userDisplayName)}
                </span>
                <span className="min-w-0 flex-1 text-xs pt-0.5">
                  <strong className="text-[var(--text)] font-medium">{e.userDisplayName}</strong>{' '}
                  <span className="text-[var(--text-secondary)]">{verb} {label}</span>
                  <small className="block text-[11px] text-[var(--text-muted)] mt-0.5">{timeAgo(e.timestamp)}</small>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
