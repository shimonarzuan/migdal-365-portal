import { useMemo, useState } from 'react';
import {
  Button, Checkbox, Dropdown, Field, Input, Option, Tab, TabList, Textarea,
} from '@fluentui/react-components';
import { FluentRTL } from '@/shared/fluent';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';
import { Icon, Check, Rocket } from '@/shared/icons';
import FormRenderer from '@/portal/forms/FormRenderer';
import FormAuditList from './FormAuditList';
import type {
  FormAudienceRule, FormDefinition, FormFieldDef, FormFieldType, FormPermissions,
  FormStatus, MailRecipientKind, MailRecipientRule, WorkflowStep,
} from '@/types';
import { FINAL_MAIL_STEP_ID } from '@/types';

/**
 * ─── Form Editor — ניהול מחזור החיים המלא של טופס ────────────────────────────
 * 8 לשוניות: כללי · שדות · Workflow · הרשאות · PDF · שליחת מייל · ארכיון
 * SharePoint · Audit. כל ההגדרות חלק מ-FormDefinition ונשמרות דרך upsert —
 * אין קוד ייעודי לטופס, גם לא להגדרות ההפצה/הארכוב שלו.
 */

const FIELD_PALETTE: { type: FormFieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'טקסט', icon: '🔤' },
  { type: 'textarea', label: 'טקסט ארוך', icon: '📝' },
  { type: 'number', label: 'מספר', icon: '🔢' },
  { type: 'date', label: 'תאריך', icon: '📅' },
  { type: 'time', label: 'שעה', icon: '🕐' },
  { type: 'checkbox', label: 'תיבת סימון', icon: '☑️' },
  { type: 'radio', label: 'בחירה יחידה', icon: '🔘' },
  { type: 'dropdown', label: 'רשימה נפתחת', icon: '📃' },
  { type: 'multiselect', label: 'בחירה מרובה', icon: '🗳️' },
  { type: 'employeePicker', label: 'בחירת עובד', icon: '👤' },
  { type: 'departmentPicker', label: 'בחירת אגף', icon: '🏢' },
  { type: 'fileUpload', label: 'העלאת קובץ', icon: '📎' },
  { type: 'signature', label: 'חתימה', icon: '✍️' },
  { type: 'yesNo', label: 'כן / לא', icon: '⚖️' },
  { type: 'richText', label: 'טקסט עשיר', icon: '📄' },
  { type: 'section', label: 'כותרת מקטע', icon: '📑' },
  { type: 'title', label: 'כותרת משנה', icon: '🔠' },
  { type: 'divider', label: 'קו מפריד', icon: '➖' },
];

const OPTION_TYPES = new Set<FormFieldType>(['radio', 'dropdown', 'multiselect']);
const LAYOUT_TYPES = new Set<FormFieldType>(['section', 'divider', 'title']);
const ICONS = ['📋', '🎓', '💼', '⚖️', '🖥️', '🚗', '🏖️', '🛠️', '🔐', '📢', '🏥', '📦'];
const COLORS = ['#0f6cbd', '#7a3e9d', '#b4462b', '#0e7a5f', '#946f00', '#c2385e'];

const TABS: { value: TabValue; label: string }[] = [
  { value: 'general', label: '1. כללי' },
  { value: 'fields', label: '2. שדות' },
  { value: 'workflow', label: '3. Workflow' },
  { value: 'permissions', label: '4. הרשאות' },
  { value: 'pdf', label: '5. PDF' },
  { value: 'mail', label: '6. שליחת מייל' },
  { value: 'archive', label: '7. ארכיון SharePoint' },
  { value: 'audit', label: '8. Audit' },
];
type TabValue = 'general' | 'fields' | 'workflow' | 'permissions' | 'pdf' | 'mail' | 'archive' | 'audit';

const AUDIENCE_KINDS: { kind: FormAudienceRule['kind']; label: string }[] = [
  { kind: 'everyone', label: 'כל העובדים' },
  { kind: 'department', label: 'אגף' },
  { kind: 'role', label: 'תפקיד מערכת' },
  { kind: 'employee', label: 'עובד/ת ספציפי/ת' },
  { kind: 'entraGroup', label: 'קבוצת Entra' },
];

const MAIL_RECIPIENT_KINDS: { kind: MailRecipientKind; label: string }[] = [
  { kind: 'submitter', label: 'המגיש/ה' },
  { kind: 'directManager', label: 'מנהל ישיר של המגיש/ה' },
  { kind: 'role', label: 'תפקיד מערכת (HR/IT/מנכ"ל וכו׳)' },
  { kind: 'department', label: 'אגף' },
  { kind: 'employee', label: 'עובד/ת ספציפי/ת' },
  { kind: 'entraGroup', label: 'קבוצת Entra' },
  { kind: 'custom', label: 'כתובת מייל מותאמת אישית' },
];

const APPROVER_TYPES: { type: WorkflowStep['approverType']; label: string }[] = [
  { type: 'directManager', label: 'מנהל ישיר של המגיש/ה' },
  { type: 'role', label: 'בעלי תפקיד מערכת' },
  { type: 'department', label: 'עובדי אגף' },
  { type: 'employee', label: 'עובד/ת ספציפי/ת' },
  { type: 'entraGroup', label: 'קבוצת Entra' },
];

const ROLE_OPTIONS: { id: string; label: string }[] = [
  { id: 'admin', label: 'מנהל/ת מערכת' },
  { id: 'hr', label: 'משאבי אנוש' },
  { id: 'it', label: 'מערכות מידע' },
  { id: 'spokesperson', label: 'דוברות' },
  { id: 'deptManager', label: 'מנהלי אגפים' },
];

const ARCHIVE_LIBRARY_SUGGESTIONS = ['ProceduresDocuments', 'EmployeeRightsDocuments', 'FormSubmissionsArchive'];

function emptyForm(createdBy: string): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: `form-${Date.now().toString(36)}`,
    version: 1,
    title: '',
    description: '',
    category: 'כללי',
    icon: '📋',
    color: COLORS[0],
    tags: [],
    deptId: '',
    status: 'draft',
    fields: [],
    workflow: [],
    permissions: { view: [{ kind: 'everyone' }], fill: [{ kind: 'everyone' }], viewSubmissions: [] },
    pdf: { enabled: false },
    mail: { steps: [] },
    archive: { enabled: false },
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

export default function FormEditor({ existing, onClose }: {
  existing: FormDefinition | null;
  onClose: () => void;
}) {
  const { user, upsert } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>('general');
  const [form, setForm] = useState<FormDefinition>(() =>
    existing
      ? { ...existing, fields: [...existing.fields], workflow: [...existing.workflow] }
      : emptyForm(user.id));

  // תומך גם בעדכון פונקציונלי — מונע דריסה בעדכונים עוקבים באותו tick
  const patch = (p: Partial<FormDefinition> | ((f: FormDefinition) => Partial<FormDefinition>)) =>
    setForm((f) => ({ ...f, ...(typeof p === 'function' ? p(f) : p) }));

  const save = (status: FormStatus) => {
    if (!form.title.trim()) { toast.error('נדרש שם לטופס'); setTab('general'); return; }
    if (form.fields.filter((f) => !LAYOUT_TYPES.has(f.type)).length === 0 && status === 'published') {
      toast.error('טופס מפורסם חייב לכלול לפחות שדה קלט אחד'); setTab('fields'); return;
    }
    const publishedEdit = existing && existing.status === 'published';
    const next: FormDefinition = {
      ...form,
      status,
      version: publishedEdit ? existing.version + 1 : form.version,
      updatedAt: new Date().toISOString(),
    };
    upsert('formDefinitions', next); // upsert מתעד created/updated ביומן אוטומטית
    toast.success(status === 'published' ? `הטופס "${next.title}" פורסם (גרסה ${next.version})` : 'הטיוטה נשמרה');
    onClose();
  };

  return (
    <FluentRTL>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-[var(--primary-dark)]">
            {form.icon} {form.title || 'טופס חדש'} <span className="text-slate-400 font-normal">· {existing ? `עריכה (v${form.version})` : 'יצירה'}</span>
          </h2>
        </div>

        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)}>
          {TABS.map((t) => <Tab key={t.value} value={t.value}>{t.label}</Tab>)}
        </TabList>

        {/* בלי AnimatePresence/mode="wait": מניעת תקיעה במעבר בין לשוניות אם
            אנימציית היציאה נחסמת (למשל בטאב לא-פעיל) — רק הכניסה מונפשת. */}
        <LazyMotion features={domAnimation}>
          <m.div key={tab}
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}>
            {tab === 'general' && <GeneralTab form={form} patch={patch} />}
            {tab === 'fields' && <FieldsTab form={form} patch={patch} />}
            {tab === 'workflow' && <WorkflowTab form={form} patch={patch} />}
            {tab === 'permissions' && <PermissionsTab form={form} patch={patch} />}
            {tab === 'pdf' && <PdfTab form={form} patch={patch} />}
            {tab === 'mail' && <MailTab form={form} patch={patch} />}
            {tab === 'archive' && <ArchiveTab form={form} patch={patch} />}
            {tab === 'audit' && <FormAuditList formId={existing?.id ?? ''} />}
          </m.div>
        </LazyMotion>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <Button appearance="secondary" onClick={onClose}>ביטול</Button>
          <div className="flex gap-2">
            <Button appearance="secondary" icon={<Icon icon={Check} size={15} />} onClick={() => save('draft')}>שמירה כטיוטה</Button>
            <Button appearance="primary" icon={<Icon icon={Rocket} size={15} />} onClick={() => save('published')}>פרסום</Button>
          </div>
        </div>
      </div>
    </FluentRTL>
  );
}

/* ─── 1. כללי ─── */
function GeneralTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const { data } = useData();
  const [tagInput, setTagInput] = useState(form.tags.join(', '));
  return (
    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl border border-slate-200 p-4">
      <Field label="שם הטופס" required>
        <Input value={form.title} onChange={(_, d) => patch({ title: d.value })} placeholder='למשל: בקשת ציוד מחשוב' />
      </Field>
      <Field label="קטגוריה">
        <Input value={form.category} onChange={(_, d) => patch({ category: d.value })} placeholder="משאבי אנוש / IT / כללי…" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="תיאור">
          <Textarea rows={2} value={form.description} onChange={(_, d) => patch({ description: d.value })} resize="vertical" />
        </Field>
      </div>
      <Field label="אגף אחראי">
        <Dropdown value={data.departments.find((d) => d.id === form.deptId)?.name ?? ''}
                  selectedOptions={form.deptId ? [form.deptId] : []}
                  onOptionSelect={(_, d) => patch({ deptId: d.optionValue ?? '' })} placeholder="בחירת אגף…">
          {data.departments.map((d) => <Option key={d.id} value={d.id}>{`${d.icon} ${d.name}`}</Option>)}
        </Dropdown>
      </Field>
      <Field label="תגיות (מופרדות בפסיק)">
        <Input value={tagInput}
               onChange={(_, d) => { setTagInput(d.value); patch({ tags: d.value.split(',').map((t) => t.trim()).filter(Boolean) }); }}
               placeholder="ציוד, IT, בקשה" />
      </Field>
      <Field label="סטטוס נוכחי">
        <Input value={form.status === 'published' ? 'מפורסם' : form.status === 'archived' ? 'בארכיון' : 'טיוטה'} readOnly
               contentAfter={<span className="text-[10px] text-slate-400 pl-1">נשלט ע"י כפתורי השמירה למטה</span>} />
      </Field>
      <Field label="בתוקף מתאריך">
        <Input type="date" value={form.validFrom ?? ''} onChange={(_, d) => patch({ validFrom: d.value || undefined })} />
      </Field>
      <Field label="בתוקף עד תאריך">
        <Input type="date" value={form.validUntil ?? ''} onChange={(_, d) => patch({ validUntil: d.value || undefined })} />
      </Field>
      <Field label="אייקון">
        <div className="flex flex-wrap gap-1">
          {ICONS.map((ic) => (
            <button key={ic} onClick={() => patch({ icon: ic })}
                    className={`text-lg rounded-lg px-2 py-1 cursor-pointer border ${form.icon === ic ? 'border-[var(--primary)] bg-[var(--accent)]' : 'border-transparent hover:bg-slate-50'}`}>
              {ic}
            </button>
          ))}
        </div>
      </Field>
      <Field label="צבע">
        <div className="flex flex-wrap gap-1.5 items-center">
          {COLORS.map((c) => (
            <button key={c} onClick={() => patch({ color: c })} aria-label={`צבע ${c}`}
                    className={`size-7 rounded-full cursor-pointer border-2 ${form.color === c ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
          ))}
        </div>
      </Field>
      <div className="sm:col-span-2">
        <Field label="הצהרה / התחייבות (מוצגת לפני השליחה — אופציונלי)">
          <Textarea rows={3} value={form.declaration ?? ''} onChange={(_, d) => patch({ declaration: d.value || undefined })} resize="vertical" />
        </Field>
      </div>
    </div>
  );
}

/* ─── 2. שדות ─── */
function FieldsTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const addField = (type: FormFieldType) => {
    const meta = FIELD_PALETTE.find((p) => p.type === type);
    const field: FormFieldDef = {
      id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      label: meta?.label ?? type,
      ...(OPTION_TYPES.has(type) ? { options: ['אפשרות 1', 'אפשרות 2'] } : {}),
    };
    patch({ fields: [...form.fields, field] });
  };

  const update = (id: string, p: Partial<FormFieldDef>) =>
    patch({ fields: form.fields.map((f) => (f.id === id ? { ...f, ...p } : f)) });

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...form.fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    patch({ fields: next });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-500 mb-2">הוספת שדה — בחרו סוג:</h3>
          <div className="flex flex-wrap gap-1.5">
            {FIELD_PALETTE.map((p) => (
              <button key={p.type} onClick={() => addField(p.type)}
                      className="text-xs bg-slate-50 hover:bg-[var(--accent)] border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors">
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {form.fields.length === 0 && <p className="text-xs text-slate-400 text-center py-6">אין שדות עדיין — בחרו סוג שדה למעלה.</p>}
          {form.fields.map((f, idx) => (
            <FieldEditor key={f.id} f={f} idx={idx} total={form.fields.length}
                         onUpdate={(p) => update(f.id, p)} onMove={(dir) => move(idx, dir)}
                         onRemove={() => patch({ fields: form.fields.filter((x) => x.id !== f.id) })} />
          ))}
        </div>
      </div>

      <div className="lg:sticky lg:top-4 self-start">
        <h3 className="text-xs font-bold text-slate-500 mb-2">👁️ תצוגה מקדימה חיה</h3>
        <FormRenderer form={form} readOnly />
      </div>
    </div>
  );
}

function FieldEditor({ f, idx, total, onUpdate, onMove, onRemove }: {
  f: FormFieldDef; idx: number; total: number;
  onUpdate: (p: Partial<FormFieldDef>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const meta = FIELD_PALETTE.find((p) => p.type === f.type);
  const isLayout = LAYOUT_TYPES.has(f.type);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 whitespace-nowrap">{meta?.icon} {meta?.label}</span>
        <Input className="flex-1" size="small" value={f.label} onChange={(_, d) => onUpdate({ label: d.value })} placeholder="תווית השדה" />
        <div className="flex gap-0.5 shrink-0">
          <Button size="small" appearance="subtle" disabled={idx === 0} onClick={() => onMove(-1)} aria-label="הזז מעלה">▲</Button>
          <Button size="small" appearance="subtle" disabled={idx === total - 1} onClick={() => onMove(1)} aria-label="הזז מטה">▼</Button>
          <Button size="small" appearance="subtle" onClick={onRemove} aria-label="מחיקה">🗑</Button>
        </div>
      </div>
      {!isLayout && (
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox label="חובה" checked={f.required === true} onChange={(_, d) => onUpdate({ required: d.checked === true })} />
          {OPTION_TYPES.has(f.type) && (
            <Input className="flex-1 min-w-40" size="small" value={(f.options ?? []).join(', ')}
                   onChange={(_, d) => onUpdate({ options: d.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                   placeholder="אפשרויות מופרדות בפסיק" />
          )}
          {(f.type === 'text' || f.type === 'textarea') && (
            <Dropdown size="small" placeholder="מילוי אוטומטי…"
                      value={f.autoFill === 'name' ? 'שם העובד' : f.autoFill === 'dept' ? 'אגף' : f.autoFill === 'title' ? 'תפקיד' : f.autoFill === 'email' ? 'מייל' : ''}
                      selectedOptions={f.autoFill ? [f.autoFill] : []}
                      onOptionSelect={(_, d) => onUpdate({ autoFill: (d.optionValue || undefined) as FormFieldDef['autoFill'] })}>
              <Option value="">ללא</Option>
              <Option value="name">שם העובד</Option>
              <Option value="dept">אגף</Option>
              <Option value="title">תפקיד</Option>
              <Option value="email">מייל</Option>
            </Dropdown>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 3. Workflow ─── */
function WorkflowTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const { data } = useData();
  const update = (i: number, p: Partial<WorkflowStep>) =>
    patch({ workflow: form.workflow.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });
  const move = (i: number, dir: -1 | 1) => {
    const next = [...form.workflow];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    patch({ workflow: next });
  };
  const add = () => patch({
    workflow: [...form.workflow, {
      id: `ws-${Date.now().toString(36)}`, name: `צעד ${form.workflow.length + 1}`, approverType: 'directManager',
    }],
  });

  return (
    <div className="space-y-3">
      {/* שרשרת חזותית: מגיש → מנהל ישיר → HR → מנכ"ל וכו' → הושלם */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs">
          <li className="rounded-full bg-slate-100 text-slate-600 px-3 py-1.5">👤 מגיש/ה</li>
          {form.workflow.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="text-slate-300">←</span>
              <span className="rounded-full bg-[var(--accent)] text-[var(--primary-dark)] px-3 py-1.5">{s.name}</span>
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="text-slate-300">←</span>
            <span className="rounded-full bg-green-100 text-green-700 px-3 py-1.5">✓ הושלם</span>
          </li>
        </ol>
        {form.workflow.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">ללא צעדים — ההגשות יטופלו ישירות ע"י בעלי הרשאת ניהול טפסים.</p>
        )}
      </div>

      {form.workflow.map((s, i) => (
        <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">{i + 1}.</span>
          <Input size="small" className="w-44" value={s.name} onChange={(_, d) => update(i, { name: d.value })} placeholder="שם הצעד" />
          <Dropdown size="small" value={APPROVER_TYPES.find((t) => t.type === s.approverType)?.label ?? ''}
                    selectedOptions={[s.approverType]}
                    onOptionSelect={(_, d) => update(i, { approverType: (d.optionValue ?? 'directManager') as WorkflowStep['approverType'], approverValue: undefined })}>
            {APPROVER_TYPES.map((t) => <Option key={t.type} value={t.type}>{t.label}</Option>)}
          </Dropdown>
          {s.approverType === 'role' && (
            <Dropdown size="small" placeholder="תפקיד…" value={ROLE_OPTIONS.find((o) => o.id === s.approverValue)?.label ?? ''}
                      selectedOptions={s.approverValue ? [s.approverValue] : []}
                      onOptionSelect={(_, d) => update(i, { approverValue: d.optionValue })}>
              {ROLE_OPTIONS.map((o) => <Option key={o.id} value={o.id}>{o.label}</Option>)}
            </Dropdown>
          )}
          {s.approverType === 'department' && (
            <Dropdown size="small" placeholder="אגף…" value={data.departments.find((d) => d.id === s.approverValue)?.name ?? ''}
                      selectedOptions={s.approverValue ? [s.approverValue] : []}
                      onOptionSelect={(_, d) => update(i, { approverValue: d.optionValue })}>
              {data.departments.map((d) => <Option key={d.id} value={d.id}>{`${d.icon} ${d.name}`}</Option>)}
            </Dropdown>
          )}
          {s.approverType === 'employee' && (
            <Dropdown size="small" placeholder="עובד/ת…" value={data.employees.find((e) => e.id === s.approverValue)?.name ?? ''}
                      selectedOptions={s.approverValue ? [s.approverValue] : []}
                      onOptionSelect={(_, d) => update(i, { approverValue: d.optionValue })}>
              {data.employees.map((e) => <Option key={e.id} value={e.id}>{e.name}</Option>)}
            </Dropdown>
          )}
          {s.approverType === 'entraGroup' && (
            <Input size="small" placeholder="שם קבוצת Entra" value={s.approverValue ?? ''}
                   onChange={(_, d) => update(i, { approverValue: d.value })} />
          )}
          <span className="mr-auto flex gap-0.5">
            <Button size="small" appearance="subtle" disabled={i === 0} onClick={() => move(i, -1)} aria-label="מעלה">▲</Button>
            <Button size="small" appearance="subtle" disabled={i === form.workflow.length - 1} onClick={() => move(i, 1)} aria-label="מטה">▼</Button>
            <Button size="small" appearance="subtle" onClick={() => patch({ workflow: form.workflow.filter((x) => x.id !== s.id) })} aria-label="הסרה">🗑</Button>
          </span>
        </div>
      ))}

      <Button appearance="secondary" onClick={add}>+ הוספת צעד אישור</Button>
    </div>
  );
}

/* ─── 4. הרשאות ─── */
function PermissionsTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const sections: { key: keyof FormPermissions; label: string; hint: string }[] = [
    { key: 'view', label: 'מי רואה את הטופס', hint: 'ריק = כולם' },
    { key: 'fill', label: 'מי יכול למלא', hint: 'ריק = כולם' },
    { key: 'viewSubmissions', label: 'מי רואה הגשות', hint: 'ריק = בעלי הרשאת ניהול טפסים בלבד' },
  ];
  const setRules = (key: keyof FormPermissions, rules: FormAudienceRule[]) =>
    patch({ permissions: { ...form.permissions, [key]: rules } });

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <AudienceEditor key={s.key} label={s.label} hint={s.hint}
                        rules={form.permissions[s.key]} onChange={(r) => setRules(s.key, r)} />
      ))}
      <p className="text-xs text-slate-400">
        עריכת הטופס עצמו שמורה לבעלי הרשאת "ניהול טפסים" (RBAC קיים). מי מקבל PDF/מייל מוגדר בלשונית "שליחת מייל".
      </p>
    </div>
  );
}

function AudienceEditor({ label, hint, rules, onChange }: {
  label: string; hint: string;
  rules: FormAudienceRule[];
  onChange: (rules: FormAudienceRule[]) => void;
}) {
  const { data } = useData();
  const update = (i: number, p: Partial<FormAudienceRule>) =>
    onChange(rules.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const valuePicker = (r: FormAudienceRule, i: number) => {
    switch (r.kind) {
      case 'everyone': return null;
      case 'department':
        return (
          <Dropdown size="small" placeholder="בחירת אגף…" value={data.departments.find((d) => d.id === r.value)?.name ?? ''}
                    selectedOptions={r.value ? [r.value] : []} onOptionSelect={(_, d) => update(i, { value: d.optionValue })}>
            {data.departments.map((d) => <Option key={d.id} value={d.id}>{`${d.icon} ${d.name}`}</Option>)}
          </Dropdown>
        );
      case 'role':
        return (
          <Dropdown size="small" placeholder="בחירת תפקיד…" value={ROLE_OPTIONS.find((o) => o.id === r.value)?.label ?? ''}
                    selectedOptions={r.value ? [r.value] : []} onOptionSelect={(_, d) => update(i, { value: d.optionValue })}>
            {ROLE_OPTIONS.map((o) => <Option key={o.id} value={o.id}>{o.label}</Option>)}
          </Dropdown>
        );
      case 'employee':
        return (
          <Dropdown size="small" placeholder="בחירת עובד/ת…" value={data.employees.find((e) => e.id === r.value)?.name ?? ''}
                    selectedOptions={r.value ? [r.value] : []} onOptionSelect={(_, d) => update(i, { value: d.optionValue })}>
            {data.employees.map((e) => <Option key={e.id} value={e.id}>{e.name}</Option>)}
          </Dropdown>
        );
      case 'entraGroup':
        return <Input size="small" placeholder="שם קבוצה (למשל MH-M365-IT)" value={r.value ?? ''}
                      onChange={(_, d) => update(i, { value: d.value })} />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600">{label} <span className="text-slate-400 font-normal">({hint})</span></h3>
        <Button size="small" appearance="secondary" onClick={() => onChange([...rules, { kind: 'department' }])}>+ כלל</Button>
      </div>
      {rules.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Dropdown size="small" value={AUDIENCE_KINDS.find((k) => k.kind === r.kind)?.label ?? ''}
                    selectedOptions={[r.kind]}
                    onOptionSelect={(_, d) => update(i, { kind: (d.optionValue ?? 'everyone') as FormAudienceRule['kind'], value: undefined })}>
            {AUDIENCE_KINDS.map((k) => <Option key={k.kind} value={k.kind}>{k.label}</Option>)}
          </Dropdown>
          {valuePicker(r, i)}
          <Button size="small" appearance="subtle" onClick={() => onChange(rules.filter((_, idx) => idx !== i))} aria-label="הסרה">🗑</Button>
        </div>
      ))}
    </div>
  );
}

/* ─── 5. PDF ─── */
function PdfTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const setPdf = (p: Partial<FormDefinition['pdf']>) => patch({ pdf: { ...form.pdf, ...p } });
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 max-w-xl">
      <Checkbox label="להפיק PDF עבור הגשות של טופס זה" checked={form.pdf.enabled}
                onChange={(_, d) => setPdf({ enabled: d.checked === true })} />
      {form.pdf.enabled && (
        <>
          <Field label="תבנית PDF" hint="מזהה/שם תבנית — ההפקה בפועל תמומש בשירות רקע (Azure Function)">
            <Input value={form.pdf.templateId ?? ''} onChange={(_, d) => setPdf({ templateId: d.value || undefined })}
                   placeholder="ברירת מחדל" />
          </Field>
          <Field label="שם קובץ" hint="ניתן להשתמש ב-{employeeName} {formTitle} {date} {submissionId}">
            <Input value={form.pdf.fileName ?? ''} onChange={(_, d) => setPdf({ fileName: d.value || undefined })}
                   placeholder="{formTitle}-{employeeName}-{date}" />
          </Field>
        </>
      )}
      {!form.pdf.enabled && <p className="text-xs text-slate-400">הפקת PDF כבויה — לא יופק קובץ עבור טופס זה.</p>}
    </div>
  );
}

/* ─── 6. שליחת מייל — הפצת PDF/עדכון אחרי כל שלב או בסיום ─── */
function MailTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const steps = useMemo(
    () => [...form.workflow.map((s) => ({ stepId: s.id, label: s.name })), { stepId: FINAL_MAIL_STEP_ID, label: '🏁 בסיום התהליך' }],
    [form.workflow],
  );

  const getSetting = (stepId: string) =>
    form.mail.steps.find((s) => s.stepId === stepId) ?? { stepId, recipients: [], attachPdf: false };

  const setSetting = (stepId: string, patchFn: (s: { stepId: string; recipients: MailRecipientRule[]; attachPdf: boolean }) => typeof form.mail.steps[number]) => {
    const current = getSetting(stepId);
    const updated = patchFn(current);
    const exists = form.mail.steps.some((s) => s.stepId === stepId);
    patch({
      mail: {
        steps: exists
          ? form.mail.steps.map((s) => (s.stepId === stepId ? updated : s))
          : [...form.mail.steps, updated],
      },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        לכל צעד ב-Workflow (ולבסיום התהליך) ניתן להגדיר בדיוק למי יישלח עדכון/PDF: המגיש, מנהל ישיר, HR, מנכ"ל
        (או כל תפקיד/אגף/עובד/קבוצת Entra אחרים), או כתובת מייל מותאמת אישית.
      </p>
      {steps.map(({ stepId, label }) => {
        const setting = getSetting(stepId);
        return (
          <div key={stepId} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-600">{label}</h3>
              <Button size="small" appearance="secondary"
                      onClick={() => setSetting(stepId, (s) => ({ ...s, recipients: [...s.recipients, { kind: 'role' }] }))}>
                + נמען
              </Button>
            </div>
            {setting.recipients.length === 0 && <p className="text-xs text-slate-400">אין נמענים מוגדרים — לא יישלח מייל בשלב זה.</p>}
            {setting.recipients.map((r, i) => (
              <MailRecipientRow key={i} rule={r}
                onChange={(next) => setSetting(stepId, (s) => ({ ...s, recipients: s.recipients.map((x, idx) => (idx === i ? next : x)) }))}
                onRemove={() => setSetting(stepId, (s) => ({ ...s, recipients: s.recipients.filter((_, idx) => idx !== i) }))} />
            ))}
            {setting.recipients.length > 0 && (
              <Checkbox label="לצרף PDF להודעה זו" checked={setting.attachPdf}
                        onChange={(_, d) => setSetting(stepId, (s) => ({ ...s, attachPdf: d.checked === true }))} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MailRecipientRow({ rule, onChange, onRemove }: {
  rule: MailRecipientRule;
  onChange: (r: MailRecipientRule) => void;
  onRemove: () => void;
}) {
  const { data } = useData();
  const valuePicker = () => {
    switch (rule.kind) {
      case 'submitter':
      case 'directManager':
        return null;
      case 'role':
        return (
          <Dropdown size="small" placeholder="בחירת תפקיד…" value={ROLE_OPTIONS.find((o) => o.id === rule.value)?.label ?? ''}
                    selectedOptions={rule.value ? [rule.value] : []} onOptionSelect={(_, d) => onChange({ ...rule, value: d.optionValue })}>
            {ROLE_OPTIONS.map((o) => <Option key={o.id} value={o.id}>{o.label}</Option>)}
          </Dropdown>
        );
      case 'department':
        return (
          <Dropdown size="small" placeholder="בחירת אגף…" value={data.departments.find((d) => d.id === rule.value)?.name ?? ''}
                    selectedOptions={rule.value ? [rule.value] : []} onOptionSelect={(_, d) => onChange({ ...rule, value: d.optionValue })}>
            {data.departments.map((d) => <Option key={d.id} value={d.id}>{`${d.icon} ${d.name}`}</Option>)}
          </Dropdown>
        );
      case 'employee':
        return (
          <Dropdown size="small" placeholder="בחירת עובד/ת…" value={data.employees.find((e) => e.id === rule.value)?.name ?? ''}
                    selectedOptions={rule.value ? [rule.value] : []} onOptionSelect={(_, d) => onChange({ ...rule, value: d.optionValue })}>
            {data.employees.map((e) => <Option key={e.id} value={e.id}>{e.name}</Option>)}
          </Dropdown>
        );
      case 'entraGroup':
        return <Input size="small" placeholder="שם קבוצה (למשל MH-M365-HR)" value={rule.value ?? ''}
                      onChange={(_, d) => onChange({ ...rule, value: d.value })} />;
      case 'custom':
        return <Input size="small" type="email" placeholder="name@migdal-haemeq.muni.il" value={rule.value ?? ''}
                      onChange={(_, d) => onChange({ ...rule, value: d.value })} />;
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown size="small" value={MAIL_RECIPIENT_KINDS.find((k) => k.kind === rule.kind)?.label ?? ''}
                selectedOptions={[rule.kind]}
                onOptionSelect={(_, d) => onChange({ kind: (d.optionValue ?? 'role') as MailRecipientKind, value: undefined })}>
        {MAIL_RECIPIENT_KINDS.map((k) => <Option key={k.kind} value={k.kind}>{k.label}</Option>)}
      </Dropdown>
      {valuePicker()}
      <Button size="small" appearance="subtle" onClick={onRemove} aria-label="הסרה">🗑</Button>
    </div>
  );
}

/* ─── 7. ארכיון SharePoint ─── */
function ArchiveTab({ form, patch }: { form: FormDefinition; patch: (p: Partial<FormDefinition>) => void }) {
  const setArchive = (p: Partial<FormDefinition['archive']>) => patch({ archive: { ...form.archive, ...p } });
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 max-w-xl">
      <Checkbox label="לשמור עותק PDF בספריית מסמכים ב-SharePoint" checked={form.archive.enabled}
                onChange={(_, d) => setArchive({ enabled: d.checked === true })} />
      {form.archive.enabled && (
        <>
          <Field label="ספריית מסמכים">
            <Dropdown value={form.archive.libraryName ?? ''} placeholder="בחירה או הזנת שם ספרייה…"
                      selectedOptions={form.archive.libraryName ? [form.archive.libraryName] : []}
                      onOptionSelect={(_, d) => setArchive({ libraryName: d.optionValue })}>
              {ARCHIVE_LIBRARY_SUGGESTIONS.map((lib) => <Option key={lib} value={lib}>{lib}</Option>)}
            </Dropdown>
          </Field>
          <Field label="נתיב תיקייה" hint="ניתן להשתמש ב-{formTitle} {yyyy} {mm}">
            <Input value={form.archive.folderPath ?? ''} onChange={(_, d) => setArchive({ folderPath: d.value || undefined })}
                   placeholder="{formTitle}/{yyyy}" />
          </Field>
        </>
      )}
      {!form.archive.enabled && <p className="text-xs text-slate-400">ארכוב כבוי — קבצי PDF לא יישמרו אוטומטית ב-SharePoint.</p>}
    </div>
  );
}
