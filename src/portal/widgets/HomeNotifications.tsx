import { useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel } from '@/shared/ui';
import { Icon, Bell } from '@/shared/icons';
import { timeAgo } from '@/shared/dates';
import type { PageId } from '@/portal/layout/Sidebar';

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-[var(--danger)]', high: 'bg-[var(--warning)]', normal: 'bg-[var(--primary)]',
};

const PREVIEW_COUNT = 5;

/** Feed התראות מוטמע בדף הבית — לא dropdown; "הצג הכל" מרחיב במקום */
export default function HomeNotifications({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { notifications, markNotificationRead } = useData();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? notifications : notifications.slice(0, PREVIEW_COUNT);

  const act = (n: (typeof notifications)[number]) => {
    markNotificationRead(n.id);
    if (n.targetPage) onNavigate(n.targetPage as PageId);
  };

  return (
    <Panel title="התראות" icon={<Icon icon={Bell} size={15} />}>
      {notifications.length === 0 ? (
        <div className="py-6 flex flex-col items-center gap-1.5 text-center">
          <Icon icon={Bell} size={22} className="text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">אין התראות חדשות</p>
        </div>
      ) : (
        <ul className="-mx-1">
          {visible.map((n) => (
            <li key={n.id}>
              <button onClick={() => act(n)}
                      className={`w-full text-right flex items-start gap-2.5 rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${n.isRead ? 'opacity-55' : ''}`}>
                <span className={`size-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.normal}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <strong className="block text-xs text-[var(--text)] truncate font-medium">{n.title}</strong>
                  <small className="block text-[11px] text-[var(--text-muted)]">{timeAgo(n.createdAt)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {notifications.length > PREVIEW_COUNT && (
        <button onClick={() => setExpanded((v) => !v)}
                className="w-full text-center text-xs text-[var(--primary)] hover:underline mt-2 cursor-pointer">
          {expanded ? 'הצג פחות' : `הצג את כל ההתראות (${notifications.length})`}
        </button>
      )}
    </Panel>
  );
}
