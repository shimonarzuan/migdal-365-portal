import { useEffect, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel, Empty } from '@/shared/ui';
import { Icon, LayoutGrid, Cake, ExternalLink } from '@/shared/icons';
import { useToast } from '@/shared/Toast';
import { isMsalMode } from '@/services/config';
import type { Birthday } from '@/types';
import AiAssistant from './AiAssistant';

/** עמודה שמאלית: קישורים מהירים · העוזר החכם · ימי הולדת */
export default function LeftColumn() {
  const { data } = useData();

  return (
    <div className="space-y-5">
      <Panel title="קישורים מהירים" icon={<Icon icon={LayoutGrid} size={15} />}>
        {data.links.length === 0
          ? <Empty text="אין קישורים מוגדרים." />
          : (
            <div className="grid grid-cols-2 gap-1.5">
              {data.links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-2 hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors">
                  <Icon icon={ExternalLink} size={15} className="text-[var(--primary)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-secondary)] truncate">{l.title}</span>
                </a>
              ))}
            </div>
          )}
      </Panel>

      <AiAssistant />

      <Panel title="ימי הולדת היום" icon={<Icon icon={Cake} size={15} />}>
        {data.birthdays.length === 0 && <Empty text="לא הוזנו ימי הולדת — ניתן לייבא מ-Excel בפאנל הניהול." />}
        <ul className="space-y-2">
          {data.birthdays.map((b) => <BirthdayRow key={b.id} b={b} />)}
        </ul>
      </Panel>
    </div>
  );
}

function BirthdayRow({ b }: { b: Birthday }) {
  const toast = useToast();
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    setPhoto(null);
    if (!isMsalMode || !b.employeeId) return;
    let alive = true;
    import('@/services/graphService')
      .then(({ getUserPhoto }) => getUserPhoto(b.employeeId!))
      .then((url) => { if (alive) setPhoto(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [b.employeeId]);

  return (
    <li className="flex items-center gap-2.5 text-sm">
      {photo
        ? <img src={photo} alt={b.name} className="size-8 rounded-full object-cover shrink-0" />
        : <span className="size-8 rounded-full bg-[var(--accent)] text-[var(--primary)] grid place-items-center shrink-0" aria-hidden><Icon icon={Cake} size={16} /></span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[var(--text-secondary)] truncate">{b.name}</span>
        <small className="text-[11px] text-[var(--text-muted)]">{b.deptName}</small>
      </span>
      <button onClick={() => toast.success(`הברכה ל${b.name} נשלחה!`)}
              className="shrink-0 text-xs bg-[var(--accent)] hover:bg-[var(--primary)] hover:text-white text-[var(--primary-dark)] rounded-[var(--radius-md)] px-3 py-1.5 transition-colors cursor-pointer">
        ברך
      </button>
    </li>
  );
}
