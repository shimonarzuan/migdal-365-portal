import { useMemo, useState } from 'react';
import {
  Button, Checkbox, Combobox, Divider, Dropdown, Field, Input, Option,
  Radio, RadioGroup, Textarea,
} from '@fluentui/react-components';
import { FluentRTL } from '@/shared/fluent';
import { useData } from '@/shared/DataContext';
import { Icon, X, FileText, Send } from '@/shared/icons';
import type { FormDefinition, FormFieldDef, FormValue } from '@/types';
import SignatureField from './SignatureField';

/**
 * ─── Forms Renderer — מנוע רינדור גנרי ──────────────────────────────────────
 * מרנדר כל FormDefinition שמגיע ממנוע הטפסים: 18 סוגי שדות, מילוי אוטומטי
 * מפרטי המשתמש, ולידציית שדות חובה, הצהרה. Fluent UI לרכיבי הממשק,
 * Tailwind ל-Layout בלבד. readOnly=true משמש לתצוגה מקדימה באשף הבנייה.
 */

export interface FormRendererProps {
  form: FormDefinition;
  onSubmit?: (values: Record<string, FormValue>) => void;
  onCancel?: () => void;
  readOnly?: boolean;   // תצוגה מקדימה — בלי שליחה
}

const LAYOUT_TYPES = new Set(['section', 'divider', 'title']);
const WIDE_TYPES = new Set(['textarea', 'richText', 'radio', 'multiselect', 'signature', 'checkbox', 'yesNo', 'fileUpload']);

export default function FormRenderer({ form, onSubmit, onCancel, readOnly = false }: FormRendererProps) {
  const { data, user, userDept } = useData();

  const autoValue = (f: FormFieldDef): FormValue => {
    switch (f.autoFill) {
      case 'name': return user.name;
      case 'dept': return userDept?.name ?? '';
      case 'title': return user.title;
      case 'email': return user.email;
      default: return f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : '';
    }
  };

  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    Object.fromEntries(form.fields.filter((f) => !LAYOUT_TYPES.has(f.type)).map((f) => [f.id, autoValue(f)])),
  );
  const [errors, setErrors] = useState<string[]>([]);

  const set = (id: string, v: FormValue) => {
    setValues((s) => ({ ...s, [id]: v }));
    setErrors((e) => e.filter((x) => x !== id));
  };

  const employeeOptions = useMemo(
    () => [...data.employees].sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [data.employees],
  );

  const missingRequired = (f: FormFieldDef): boolean => {
    if (!f.required || LAYOUT_TYPES.has(f.type)) return false;
    const v = values[f.id];
    if (f.type === 'checkbox') return v !== true;
    if (f.type === 'yesNo') return v !== true && v !== false;
    if (Array.isArray(v)) return v.length === 0;
    return v === '' || v == null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    const missing = form.fields.filter(missingRequired).map((f) => f.id);
    if (missing.length > 0) { setErrors(missing); return; }
    onSubmit(values);
  };

  const err = (f: FormFieldDef) => (errors.includes(f.id) ? 'שדה חובה' : undefined);

  const renderField = (f: FormFieldDef) => {
    switch (f.type) {
      // ─── אלמנטי Layout ───
      case 'section':
        return <h3 className="text-sm font-bold text-[var(--primary-dark)] border-b border-slate-200 pb-1.5 mt-2">{f.label}</h3>;
      case 'title':
        return <h4 className="text-sm font-semibold text-slate-700">{f.label}</h4>;
      case 'divider':
        return <Divider />;

      // ─── קלט ───
      case 'textarea':
      case 'richText':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Textarea rows={f.type === 'richText' ? 5 : 3} placeholder={f.placeholder} resize="vertical"
                      value={String(values[f.id] ?? '')} onChange={(_, d) => set(f.id, d.value)} disabled={readOnly} />
          </Field>
        );
      case 'number':
      case 'date':
      case 'time':
      case 'text':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Input type={f.type === 'text' ? 'text' : f.type} placeholder={f.placeholder}
                   value={String(values[f.id] ?? '')} onChange={(_, d) => set(f.id, d.value)} disabled={readOnly} />
          </Field>
        );
      case 'checkbox':
        return (
          <Field validationMessage={err(f)}>
            <Checkbox label={f.label + (f.required ? ' *' : '')} checked={values[f.id] === true}
                      onChange={(_, d) => set(f.id, d.checked === true)} disabled={readOnly} />
          </Field>
        );
      case 'yesNo':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <RadioGroup layout="horizontal"
                        value={values[f.id] === true ? 'כן' : values[f.id] === false ? 'לא' : ''}
                        onChange={(_, d) => set(f.id, d.value === 'כן')} disabled={readOnly}>
              <Radio value="כן" label="כן" />
              <Radio value="לא" label="לא" />
            </RadioGroup>
          </Field>
        );
      case 'radio':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <RadioGroup value={String(values[f.id] ?? '')} onChange={(_, d) => set(f.id, d.value)} disabled={readOnly}>
              {(f.options ?? []).map((o) => <Radio key={o} value={o} label={o} />)}
            </RadioGroup>
          </Field>
        );
      case 'dropdown':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Dropdown placeholder={f.placeholder ?? 'בחירה…'} value={String(values[f.id] ?? '')}
                      selectedOptions={values[f.id] ? [String(values[f.id])] : []}
                      onOptionSelect={(_, d) => set(f.id, d.optionValue ?? '')} disabled={readOnly}>
              {(f.options ?? []).map((o) => <Option key={o} value={o}>{o}</Option>)}
            </Dropdown>
          </Field>
        );
      case 'multiselect': {
        const selected = Array.isArray(values[f.id]) ? values[f.id] as string[] : [];
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Dropdown multiselect placeholder={f.placeholder ?? 'בחירה מרובה…'} value={selected.join(', ')}
                      selectedOptions={selected}
                      onOptionSelect={(_, d) => set(f.id, d.selectedOptions)} disabled={readOnly}>
              {(f.options ?? []).map((o) => <Option key={o} value={o}>{o}</Option>)}
            </Dropdown>
          </Field>
        );
      }
      case 'employeePicker':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Combobox placeholder={f.placeholder ?? 'חיפוש עובד/ת…'} value={String(values[f.id] ?? '')}
                      onOptionSelect={(_, d) => set(f.id, d.optionText ?? '')}
                      onChange={(e) => set(f.id, e.target.value)} disabled={readOnly} freeform>
              {employeeOptions.map((emp) => (
                <Option key={emp.id} value={emp.name} text={emp.name}>{`${emp.name} · ${emp.title}`}</Option>
              ))}
            </Combobox>
          </Field>
        );
      case 'departmentPicker':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <Dropdown placeholder={f.placeholder ?? 'בחירת אגף…'} value={String(values[f.id] ?? '')}
                      selectedOptions={values[f.id] ? [String(values[f.id])] : []}
                      onOptionSelect={(_, d) => set(f.id, d.optionValue ?? '')} disabled={readOnly}>
              {data.departments.map((d) => <Option key={d.id} value={d.name}>{`${d.icon} ${d.name}`}</Option>)}
            </Dropdown>
          </Field>
        );
      case 'fileUpload':
        return (
          <Field label={f.label} required={f.required} validationMessage={err(f)}
                 hint={f.hint ?? 'הקובץ יצורף להגשה; העלאה ל-SharePoint תופעל בחיבור לשרת'}>
            <input
              type="file"
              className="text-sm text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-xs file:text-[var(--primary-dark)] file:cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                set(f.id, file ? `${file.name} (${Math.ceil(file.size / 1024)}KB)` : '');
              }}
              disabled={readOnly}
            />
          </Field>
        );
      case 'signature':
        return (
          <Field label={f.label} required={f.required} hint={f.hint} validationMessage={err(f)}>
            <SignatureField value={String(values[f.id] ?? '')} onChange={(v) => set(f.id, v)} />
          </Field>
        );
    }
  };

  return (
    <FluentRTL>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 max-w-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold" style={{ color: form.color ?? 'var(--primary-dark)' }}>
              {form.icon} {form.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{form.description}</p>
          </div>
          {onCancel && (
            <Button appearance="subtle" size="small" onClick={onCancel} aria-label="סגירה" icon={<Icon icon={X} size={16} />} />
          )}
        </div>

        {!readOnly && (
          <div className="rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            מגיש/ה: <strong>{user.name}</strong> · ההגשה מזוהה באמצעות חשבונך ונרשמת עם חותמת זמן.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
          {form.fields.map((f) => (
            <div key={f.id} className={LAYOUT_TYPES.has(f.type) || WIDE_TYPES.has(f.type) ? 'sm:col-span-2' : ''}>
              {renderField(f)}
            </div>
          ))}
        </div>

        {form.declaration && (
          <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-bg)] px-3.5 py-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="flex items-center gap-1.5 mb-1 text-[var(--warning-text)]"><Icon icon={FileText} size={14} /> הצהרה והתחייבות</strong>
            {form.declaration}
          </div>
        )}

        {!readOnly && (
          <div className="flex gap-2 justify-end pt-1">
            {onCancel && <Button appearance="secondary" onClick={onCancel}>ביטול</Button>}
            <Button appearance="primary" type="submit" icon={<Icon icon={Send} size={16} />}>שליחת הבקשה</Button>
          </div>
        )}
      </form>
    </FluentRTL>
  );
}
