import { useState } from 'react';
import { Btn, Empty, Field, inputCls } from '@/shared/ui';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'checkbox' | 'date' | 'textarea';
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface ColumnDef<T> { key: string; label: string; render?: (item: T) => React.ReactNode }

interface Props<T extends { id: string }> {
  title: string;
  icon: React.ReactNode;
  items: T[];
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  newItem: () => T;
  onSave: (item: T) => void;
  onDelete: (id: string) => void;
  extraHeader?: React.ReactNode;
}

const rowStagger = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const rowVariant = { hidden: { opacity: 0, y: -4 }, show: { opacity: 1, y: 0 } };

/**
 * EntityManager — רכיב CRUD גנרי לפאנל הניהול.
 * טבלה + טופס הוספה/עריכה + מחיקה, לכל ישות במערכת.
 */
export default function EntityManager<T extends { id: string }>({
  title, icon, items, columns, fields, newItem, onSave, onDelete, extraHeader,
}: Props<T>) {
  const [editing, setEditing] = useState<T | null>(null);

  const set = (key: string, value: unknown) => setEditing((e) => (e ? { ...e, [key]: value } : e));

  return (
    <LazyMotion features={domAnimation}>
    <section className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-wrap gap-2 sticky top-[64px] bg-[var(--surface)] z-[var(--z-sticky)] rounded-t-[var(--radius-lg)]">
        <h2 className="text-sm font-bold text-[var(--primary-dark)] flex items-center gap-2">{icon} {title} <span className="text-[var(--text-muted)] font-normal">({items.length})</span></h2>
        <div className="flex gap-2 items-center">
          {extraHeader}
          <Btn small onClick={() => setEditing(newItem())}>+ הוספה</Btn>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
              {columns.map((c) => <th key={c.key} className="px-4 py-2 font-medium">{c.label}</th>)}
              <th className="px-4 py-2 font-medium w-28">פעולות</th>
            </tr>
          </thead>
          <m.tbody variants={rowStagger} initial="hidden" animate="show">
            {items.length === 0 && (
              <tr><td colSpan={columns.length + 1}><Empty text="אין רשומות." /></td></tr>
            )}
            <AnimatePresence>
              {items.map((item) => (
                <m.tr key={item.id} variants={rowVariant}
                      exit={{ x: [0, -5, 5, -3, 16], opacity: [1, 1, 1, 1, 0] }}
                      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.out }}
                      className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-hover)] transition-colors duration-[var(--dur-fast)]">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 text-[var(--text-secondary)]">
                      {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? '')}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Btn small variant="outline" onClick={() => setEditing(item)}>עריכה</Btn>
                      <Btn small variant="danger" onClick={() => { if (confirm('למחוק רשומה זו?')) onDelete(item.id); }}>מחיקה</Btn>
                    </div>
                  </td>
                </m.tr>
              ))}
            </AnimatePresence>
          </m.tbody>
        </table>
      </div>

      {/* טופס עריכה/הוספה */}
      <AnimatePresence>
        {editing && (
          <m.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
            className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setEditing(null)}
          >
            <m.form
              role="dialog" aria-modal="true" aria-label={`${title} — עריכה`}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }}
              onSubmit={(e) => { e.preventDefault(); onSave(editing); setEditing(null); }}
              className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-3"
            >
              <h3 className="text-base font-bold text-[var(--primary-dark)] flex items-center gap-2">{icon} {title} — עריכה</h3>
              {fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  {f.type === 'select' ? (
                    <select className={inputCls} required={f.required}
                            value={String((editing as Record<string, unknown>)[f.key] ?? '')}
                            onChange={(e) => set(f.key, e.target.value)}>
                      <option value="">— בחירה —</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <input type="checkbox" className="size-5 accent-[var(--primary)]"
                           checked={Boolean((editing as Record<string, unknown>)[f.key])}
                           onChange={(e) => set(f.key, e.target.checked)} />
                  ) : f.type === 'textarea' ? (
                    <textarea className={inputCls} rows={3} required={f.required}
                              value={String((editing as Record<string, unknown>)[f.key] ?? '')}
                              onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input type={f.type ?? 'text'} className={inputCls} required={f.required}
                           value={String((editing as Record<string, unknown>)[f.key] ?? '')}
                           onChange={(e) => set(f.key, e.target.value)} />
                  )}
                </Field>
              ))}
              <div className="flex gap-2 justify-end pt-3 sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] -mx-5 px-5 -mb-5 pb-4 mt-2">
                <Btn variant="ghost" onClick={() => setEditing(null)}>ביטול</Btn>
                <Btn type="submit">שמירה</Btn>
              </div>
            </m.form>
          </m.div>
        )}
      </AnimatePresence>
    </section>
    </LazyMotion>
  );
}
