import { useMemo, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle,
  Tab, TabList,
} from '@fluentui/react-components';
import { FluentRTL } from '@/shared/fluent';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { Badge, Empty } from '@/shared/ui';
import { Icon, ClipboardList, Inbox, Plus, Pencil, Copy, Rocket, FileText, Trash2 } from '@/shared/icons';
import { duplicateForm } from '@/services/formsService';
import FormEditor from './FormEditor';
import FormAuditList from './FormAuditList';
import SubmissionsReview from './SubmissionsReview';
import type { FormDefinition, FormStatus } from '@/types';

const fmtDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

const STATUS_META: Record<FormStatus, { label: string; tone: 'amber' | 'green' | 'slate' }> = {
  draft: { label: 'טיוטה', tone: 'amber' },
  published: { label: 'מפורסם', tone: 'green' },
  archived: { label: 'בארכיון', tone: 'slate' },
};

type Tab_ = 'forms' | 'submissions';

/**
 * ─── ניהול טפסים — מודול מנוע הטפסים בפאנל הניהול ───────────────────────────
 * יצירה (אשף), עריכה, שכפול, פרסום/ביטול פרסום, מחיקה, מוני הגשות, סטטוסים,
 * גרסאות ו-Audit — הכל על נתוני FormDefinition, בלי קוד לטופס.
 */
export default function AdminFormsManager() {
  const { data, upsert, remove, audit, user, can } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<Tab_>('forms');
  const [editing, setEditing] = useState<FormDefinition | null | 'new'>(null);
  const [deleting, setDeleting] = useState<FormDefinition | null>(null);
  const [auditFor, setAuditFor] = useState<FormDefinition | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; pending: number }>();
    for (const s of data.formSubmissions) {
      const c = m.get(s.formId) ?? { total: 0, pending: 0 };
      c.total += 1;
      if (s.status === 'pending') c.pending += 1;
      m.set(s.formId, c);
    }
    return m;
  }, [data.formSubmissions]);

  if (!can('forms.manage')) return null;

  if (editing) {
    return (
      <FormEditor existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
    );
  }

  const togglePublish = (f: FormDefinition) => {
    const next: FormDefinition = {
      ...f,
      status: f.status === 'published' ? 'archived' : 'published',
      updatedAt: new Date().toISOString(),
    };
    upsert('formDefinitions', next);
    audit(next.status === 'published' ? 'published' : 'unpublished', 'formDefinition', f.id, { status: f.status }, { status: next.status });
    if (next.status === 'published') toast.success(`"${f.title}" פורסם`);
    else toast.warning(`הפרסום של "${f.title}" בוטל — הטופס לא יוצג עוד לעובדים`);
  };

  const doDuplicate = (f: FormDefinition) => {
    const copy = duplicateForm(f, user.id);
    upsert('formDefinitions', copy);
    audit('duplicated', 'formDefinition', copy.id, null, { from: f.id, title: copy.title });
    toast.success(`נוצר עותק: "${copy.title}" (טיוטה)`);
  };

  const doDelete = () => {
    if (!deleting) return;
    remove('formDefinitions', deleting.id);
    toast.success(`הטופס "${deleting.title}" נמחק`);
    setDeleting(null);
  };

  const forms = [...data.formDefinitions].sort((a, b) =>
    Number(b.status === 'published') - Number(a.status === 'published') || b.updatedAt.localeCompare(a.updatedAt));

  return (
    <FluentRTL>
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as Tab_)}>
            <Tab value="forms" icon={<Icon icon={ClipboardList} size={16} />}>טפסים ({data.formDefinitions.length})</Tab>
            <Tab value="submissions" icon={<Icon icon={Inbox} size={16} />}>הגשות ({data.formSubmissions.length})</Tab>
          </TabList>
          {tab === 'forms' && (
            <Button appearance="primary" icon={<Icon icon={Plus} size={16} />} onClick={() => setEditing('new')}>טופס חדש</Button>
          )}
        </div>

        {tab === 'submissions' && <SubmissionsReview />}

        {tab === 'forms' && (
          <section className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
            {forms.length === 0 && <Empty text="אין טפסים — צרו את הטופס הראשון באשף." />}
            <ul>
              {forms.map((f) => {
                const c = counts.get(f.id);
                const meta = STATUS_META[f.status];
                return (
                  <li key={f.id} className="border-b border-[var(--border)] last:border-0 px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="grid place-items-center size-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden><Icon icon={ClipboardList} size={16} /></span>
                    <div className="flex-1 min-w-40">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm text-[var(--text)]">{f.title}</strong>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="text-[10px] text-[var(--text-muted)]">v{f.version} · {f.category}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        עודכן {fmtDate(f.updatedAt)}
                        {c ? ` · ${c.total} הגשות${c.pending ? ` (${c.pending} בטיפול)` : ''}` : ' · אין הגשות'}
                        {(f.validFrom || f.validUntil) && ` · תוקף: ${f.validFrom ?? '∞'}–${f.validUntil ?? '∞'}`}
                      </p>
                    </div>
                    <span className="flex flex-wrap gap-1">
                      <Button size="small" appearance="secondary" icon={<Icon icon={Pencil} size={14} />} onClick={() => setEditing(f)}>עריכה</Button>
                      <Button size="small" appearance="secondary" icon={<Icon icon={Copy} size={14} />} onClick={() => doDuplicate(f)}>שכפול</Button>
                      <Button size="small" appearance="secondary" icon={<Icon icon={Rocket} size={14} />} onClick={() => togglePublish(f)}>
                        {f.status === 'published' ? 'ביטול פרסום' : 'פרסום'}
                      </Button>
                      <Button size="small" appearance="secondary" icon={<Icon icon={FileText} size={14} />} onClick={() => setAuditFor(f)}>Audit</Button>
                      <Button size="small" appearance="secondary" icon={<Icon icon={Trash2} size={14} />} onClick={() => setDeleting(f)}>מחיקה</Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* דיאלוג אישור מחיקה */}
        <Dialog open={deleting !== null} onOpenChange={(_, d) => { if (!d.open) setDeleting(null); }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>מחיקת טופס</DialogTitle>
              <DialogContent>
                למחוק את "{deleting?.title}"? הגשות קיימות ({counts.get(deleting?.id ?? '')?.total ?? 0}) יישמרו אך לא יהיה ניתן להגיש חדשות. פעולה זו נרשמת ביומן הביקורת.
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setDeleting(null)}>ביטול</Button>
                <Button appearance="primary" onClick={doDelete}>מחיקה</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* דיאלוג Audit לטופס */}
        <Dialog open={auditFor !== null} onOpenChange={(_, d) => { if (!d.open) setAuditFor(null); }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>יומן ביקורת — {auditFor?.title}</DialogTitle>
              <DialogContent>
                <FormAuditList formId={auditFor?.id ?? ''} />
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setAuditFor(null)}>סגירה</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </FluentRTL>
  );
}
