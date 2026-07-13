import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Badge, Empty, inputCls } from '@/shared/ui';
import { getAuditLog } from '@/services/auditService';

const ACTION_LABELS: Record<string, string> = {
  created: 'יצירה', updated: 'עדכון', deleted: 'מחיקה', signed: 'חתימה',
  published: 'פרסום', reminderSent: 'תזכורת', roleChanged: 'שינוי הרשאה',
};
const ACTION_TONES: Record<string, 'green' | 'blue' | 'red' | 'amber' | 'slate'> = {
  created: 'green', updated: 'blue', deleted: 'red', signed: 'green', published: 'blue', reminderSent: 'amber',
};

/** ─── יומן ביקורת — כל הפעולות הניהוליות ─── */
export default function AdminAudit() {
  const { can } = useData();
  const [q, setQ] = useState('');
  const entries = useMemo(() => getAuditLog(), []);

  if (!can('audit.view')) return <Empty text="אין לך הרשאה לצפייה ביומן הביקורת." />;

  const filtered = entries.filter((e) =>
    !q.trim() || e.userDisplayName.includes(q) || e.entityType.includes(q) || e.action.includes(q));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        <input type="search" className={inputCls + ' flex-1 min-w-48'} placeholder="חיפוש לפי משתמש, ישות או פעולה…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-slate-400">{filtered.length} רשומות · פיתוח: localStorage · ייצור: רשימת AuditLog ב-SharePoint</span>
      </div>
      <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
              <th className="px-3 py-2 font-medium">זמן</th>
              <th className="px-3 py-2 font-medium">משתמש</th>
              <th className="px-3 py-2 font-medium">פעולה</th>
              <th className="px-3 py-2 font-medium">ישות</th>
              <th className="px-3 py-2 font-medium">שינוי</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5}><Empty text="אין רשומות ביומן." /></td></tr>}
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 align-top">
                <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">{e.timestamp.slice(0, 16).replace('T', ' ')}</td>
                <td className="px-3 py-2 text-slate-700">{e.userDisplayName}</td>
                <td className="px-3 py-2"><Badge tone={ACTION_TONES[e.action] ?? 'slate'}>{ACTION_LABELS[e.action] ?? e.action}</Badge></td>
                <td className="px-3 py-2 text-xs text-slate-500">{e.entityType}<br /><span className="text-slate-300">{e.entityId}</span></td>
                <td className="px-3 py-2 text-[11px] text-slate-400 max-w-64">
                  {e.newValue && <div className="truncate" title={e.newValue}>→ {e.newValue.slice(0, 80)}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
