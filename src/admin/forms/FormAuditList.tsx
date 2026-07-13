import { useMemo } from 'react';
import { getAuditLog } from '@/services/auditService';

const ACTION_LABEL: Record<string, string> = {
  created: 'נוצר', updated: 'עודכן', deleted: 'נמחק', published: 'פורסם',
  unpublished: 'פרסום בוטל', duplicated: 'שוכפל', submitted: 'הוגשה בקשה',
  approved: 'אושרה בקשה', rejected: 'נדחתה בקשה',
};

/** יומן ביקורת לטופס בודד — משותף בין דיאלוג הרשימה ולשונית ה-Audit בעורך */
export default function FormAuditList({ formId }: { formId: string }) {
  const entries = useMemo(
    () => getAuditLog()
      .filter((e) => (e.entityType === 'formDefinition' || e.entityType === 'formDefinitions') && e.entityId === formId)
      .slice(0, 50),
    [formId],
  );
  if (!formId) return <p className="text-xs text-slate-400">אין רשומות עדיין — יופיעו לאחר השמירה הראשונה.</p>;
  if (entries.length === 0) return <p className="text-xs text-slate-400">אין רשומות ביומן לטופס זה.</p>;
  return (
    <ul className="space-y-1.5 max-h-96 overflow-auto">
      {entries.map((e) => (
        <li key={e.id} className="text-xs border-b border-slate-100 pb-1.5">
          <strong>{ACTION_LABEL[e.action] ?? e.action}</strong> ע"י {e.userDisplayName}
          <span className="text-slate-400"> · {new Date(e.timestamp).toLocaleString('he-IL')}</span>
        </li>
      ))}
    </ul>
  );
}
