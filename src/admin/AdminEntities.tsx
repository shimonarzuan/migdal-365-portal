import { useData } from '@/shared/DataContext';
import { Badge, Btn } from '@/shared/ui';
import { Icon, Building2, FolderClosed, Megaphone, Calendar, ListChecks, Rocket, Scale, Cake, Upload, Download } from '@/shared/icons';
import EntityManager from './EntityManager';
import { RIGHTS_CATEGORIES } from '@/services/employeeRightsService';
import type { DeptMeta, Procedure, Announcement, TaskItem, LinkItem, Birthday, EventItem, EmployeeRightsItem } from '@/types';

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

/** מקטעי CRUD גנריים של פאנל הניהול */

export function AdminDepartments() {
  const { data, upsert, remove } = useData();
  return (
    <EntityManager<DeptMeta>
      title="ניהול אגפים" icon={<Icon icon={Building2} size={16} />} items={data.departments}
      columns={[
        { key: 'name', label: 'אגף', render: (d) => `${d.icon} ${d.name}` },
        { key: 'managerName', label: 'מנהל/ת' },
        { key: 'size', label: 'עובדים', render: (d) => String(data.employees.filter((e) => e.deptId === d.id).length) },
        { key: 'phone', label: 'טלפון' },
      ]}
      fields={[
        { key: 'name', label: 'שם האגף', required: true },
        { key: 'icon', label: 'אייקון (אימוג׳י)' },
        { key: 'description', label: 'תיאור', type: 'textarea' },
        { key: 'managerName', label: 'מנהל/ת' },
        { key: 'contactEmail', label: 'דוא"ל' },
        { key: 'phone', label: 'טלפון' },
      ]}
      newItem={() => ({ id: uid('dept'), name: '', icon: '🏢', description: '', managerName: '', contactEmail: '', phone: '', documents: [], links: [], requiresReadAndSign: false })}
      onSave={(d) => upsert('departments', d)} onDelete={(id) => remove('departments', id)}
    />
  );
}

export function AdminProcedures() {
  const { data, upsert, remove } = useData();
  const deptOptions = data.departments.map((d) => ({ value: d.id, label: d.name }));
  return (
    <EntityManager<Procedure>
      title="ניהול נהלים" icon={<Icon icon={FolderClosed} size={16} />} items={data.procedures}
      extraHeader={<Btn small variant="outline" onClick={() => alert('העלאת PDF (דמו) — בגרסה מלאה: העלאה ל-SharePoint')}><Icon icon={Upload} size={14} /> העלאת PDF</Btn>}
      columns={[
        { key: 'title', label: 'נוהל' },
        { key: 'dept', label: 'אגף', render: (p) => data.departments.find((d) => d.id === p.deptId)?.name ?? '—' },
        { key: 'flags', label: 'סטטוס', render: (p) => (
          <span className="flex gap-1">
            {p.requiresReadAndSign && <Badge tone="amber">חובת חתימה</Badge>}
            {p.internal && <Badge tone="slate">פנימי</Badge>}
          </span>
        ) },
        { key: 'updatedAt', label: 'עודכן' },
      ]}
      fields={[
        { key: 'title', label: 'שם הנוהל', required: true },
        { key: 'description', label: 'תיאור', type: 'textarea' },
        { key: 'deptId', label: 'שיוך אגף', type: 'select', options: deptOptions, required: true },
        { key: 'updatedAt', label: 'תאריך עדכון', type: 'date' },
        { key: 'internal', label: 'נוהל פנימי (לעובדי האגף בלבד)', type: 'checkbox' },
        { key: 'requiresReadAndSign', label: 'חובה לקריאה וחתימה', type: 'checkbox' },
      ]}
      newItem={() => ({ id: uid('p'), title: '', description: '', deptId: '', updatedAt: new Date().toISOString().slice(0, 10), internal: false, requiresReadAndSign: false })}
      onSave={(p) => upsert('procedures', p)} onDelete={(id) => remove('procedures', id)}
    />
  );
}

export function AdminAnnouncements() {
  const { data, upsert, remove, settings, updateSettings, user } = useData();
  const deptOptions = [{ value: '', label: 'כלל-עירוני' }, ...data.departments.map((d) => ({ value: d.id, label: d.name }))];
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--primary-dark)]"><Icon icon={Megaphone} size={15} /> דבר ראש העיר</h2>
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3}
          value={settings.mayor.body}
          onChange={(e) => updateSettings({ mayor: { ...settings.mayor, body: e.target.value, date: new Date().toISOString().slice(0, 10) } })}
        />
        <p className="text-xs text-slate-400">נשמר אוטומטית · מוצג בדף הבית לכלל העובדים.</p>
      </section>

      <EntityManager<Announcement>
        title="הודעות, חדשות ובאנרים" icon={<Icon icon={Megaphone} size={16} />} items={data.announcements}
        columns={[
          { key: 'title', label: 'כותרת' },
          { key: 'kind', label: 'סוג', render: (a) => <Badge tone={a.kind === 'news' ? 'green' : a.kind === 'banner' ? 'amber' : 'blue'}>{a.kind === 'news' ? 'חדשות' : a.kind === 'banner' ? 'באנר' : 'הודעה'}</Badge> },
          { key: 'dept', label: 'יעד', render: (a) => (a.deptId ? data.departments.find((d) => d.id === a.deptId)?.name : 'כלל-עירוני') },
          { key: 'date', label: 'תאריך' },
        ]}
        fields={[
          { key: 'title', label: 'כותרת', required: true },
          { key: 'body', label: 'תוכן', type: 'textarea', required: true },
          { key: 'type', label: 'מקור ההודעה', type: 'select', options: [
            { value: 'mayor', label: 'דבר ראש העיר' }, { value: 'ceo', label: 'מנכ"ל' },
            { value: 'spokesperson', label: 'דוברות' }, { value: 'hr', label: 'משאבי אנוש' },
            { value: 'it', label: 'מערכות מידע' }, { value: 'department', label: 'אגף' },
            { value: 'emergency', label: '🚨 הודעת חירום' },
          ] },
          { key: 'kind', label: 'תצוגה', type: 'select', options: [{ value: 'announcement', label: 'הודעה' }, { value: 'news', label: 'חדשות' }, { value: 'banner', label: 'באנר' }] },
          { key: 'priority', label: 'דחיפות', type: 'select', options: [{ value: 'normal', label: 'רגילה' }, { value: 'high', label: 'גבוהה' }, { value: 'urgent', label: 'דחופה' }] },
          { key: 'deptId', label: 'יעד', type: 'select', options: deptOptions },
          { key: 'date', label: 'תאריך פרסום', type: 'date' },
          { key: 'expiryDate', label: 'בתוקף עד', type: 'date' },
          { key: 'pinned', label: 'נעוץ למעלה', type: 'checkbox' },
        ]}
        newItem={() => ({ id: uid('a'), title: '', body: '', date: new Date().toISOString().slice(0, 10), kind: 'announcement', type: 'spokesperson', priority: 'normal', audience: 'all', createdBy: user.id })}
        onSave={(a) => upsert('announcements', { ...a, deptId: a.deptId || undefined, audience: a.deptId ? 'department' : 'all' })}
        onDelete={(id) => remove('announcements', id)}
      />

      <EntityManager<EventItem>
        title="אירועים" icon={<Icon icon={Calendar} size={16} />} items={data.events}
        columns={[
          { key: 'title', label: 'אירוע', render: (e) => `${e.icon ?? '📌'} ${e.title}` },
          { key: 'date', label: 'תאריך' },
          { key: 'place', label: 'מקום' },
        ]}
        fields={[
          { key: 'title', label: 'שם האירוע', required: true },
          { key: 'date', label: 'תאריך', type: 'date', required: true },
          { key: 'place', label: 'מקום' },
          { key: 'icon', label: 'אייקון (אימוג׳י)' },
        ]}
        newItem={() => ({ id: uid('ev'), title: '', date: new Date().toISOString().slice(0, 10), place: '', icon: '📌' })}
        onSave={(e) => upsert('events', e)} onDelete={(id) => remove('events', id)}
      />
    </div>
  );
}

export function AdminTasks() {
  const { data, upsert, remove, user } = useData();
  const deptOptions = [{ value: '', label: 'כלל העובדים' }, ...data.departments.map((d) => ({ value: d.id, label: d.name }))];
  const userOptions = [{ value: '', label: '—' }, ...[...data.employees].sort((a, b) => a.name.localeCompare(b.name, 'he')).map((u) => ({ value: u.id, label: u.name }))];
  return (
    <EntityManager<TaskItem>
      title="ניהול משימות" icon={<Icon icon={ListChecks} size={16} />} items={data.tasks}
      columns={[
        { key: 'title', label: 'משימה' },
        { key: 'assignee', label: 'משויך ל־', render: (t) => t.assigneeId ? (data.employees.find((u) => u.id === t.assigneeId)?.name ?? '—') : (t.deptId ? `אגף ${data.departments.find((d) => d.id === t.deptId)?.name}` : 'כולם') },
        { key: 'due', label: 'יעד' },
        { key: 'done', label: 'סטטוס', render: (t) => <Badge tone={t.done ? 'green' : 'amber'}>{t.done ? 'הושלמה' : 'פתוחה'}</Badge> },
      ]}
      fields={[
        { key: 'title', label: 'כותרת המשימה', required: true },
        { key: 'description', label: 'תיאור', type: 'textarea' },
        { key: 'assigneeId', label: 'שיוך לעובד (משימה אישית)', type: 'select', options: userOptions },
        { key: 'deptId', label: 'שיוך לאגף (משימה אגפית)', type: 'select', options: deptOptions },
        { key: 'due', label: 'תאריך יעד', type: 'date', required: true },
        { key: 'priority', label: 'עדיפות', type: 'select', options: [{ value: 'low', label: 'נמוכה' }, { value: 'normal', label: 'רגילה' }, { value: 'high', label: 'גבוהה' }] },
        { key: 'status', label: 'סטטוס', type: 'select', options: [{ value: 'open', label: 'פתוחה' }, { value: 'inProgress', label: 'בביצוע' }, { value: 'done', label: 'הושלמה' }] },
      ]}
      newItem={() => ({ id: uid('t'), title: '', description: '', due: new Date().toISOString().slice(0, 10), done: false, status: 'open' as const, priority: 'normal' as const, assigneeType: 'general' as const, createdBy: user.id })}
      onSave={(t) => upsert('tasks', {
        ...t,
        deptId: t.deptId || undefined,
        assigneeId: t.assigneeId || undefined,
        assigneeIds: t.assigneeId ? [t.assigneeId] : [],
        assigneeType: t.assigneeId ? 'personal' : t.deptId ? 'department' : 'general',
        done: (t.status ?? 'open') === 'done',
      })}
      onDelete={(id) => remove('tasks', id)}
    />
  );
}

export function AdminLinks() {
  const { data, upsert, remove } = useData();
  return (
    <EntityManager<LinkItem>
      title="ניהול קישורים ומערכות" icon={<Icon icon={Rocket} size={16} />} items={data.links}
      columns={[
        { key: 'title', label: 'מערכת', render: (l) => `${l.icon ?? '🔗'} ${l.title}` },
        { key: 'url', label: 'כתובת', render: (l) => <span className="text-xs text-slate-400 break-all">{l.url}</span> },
      ]}
      fields={[
        { key: 'title', label: 'שם המערכת', required: true },
        { key: 'url', label: 'כתובת URL', required: true },
        { key: 'icon', label: 'אייקון (אימוג׳י)' },
      ]}
      newItem={() => ({ id: uid('l'), title: '', url: 'https://', icon: '🔗' })}
      onSave={(l) => upsert('links', l)} onDelete={(id) => remove('links', id)}
    />
  );
}

export function AdminEmployeeRights() {
  const { data, upsert, remove } = useData();
  const categoryOptions = RIGHTS_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` }));
  return (
    <EntityManager<EmployeeRightsItem>
      title="ניהול דע את זכויותיך" icon={<Icon icon={Scale} size={16} />} items={data.employeeRights}
      columns={[
        { key: 'category', label: 'קטגוריה', render: (r) => {
          const c = RIGHTS_CATEGORIES.find((c) => c.id === r.category);
          return c ? `${c.icon} ${c.label}` : r.category;
        } },
        { key: 'title', label: 'כותרת' },
        { key: 'updatedAt', label: 'עודכן' },
        { key: 'documentUrl', label: 'מסמך', render: (r) => r.documentUrl ? <Badge tone="blue">קישור מצורף</Badge> : <span className="text-slate-300">—</span> },
      ]}
      fields={[
        { key: 'category', label: 'קטגוריה', type: 'select', options: categoryOptions, required: true },
        { key: 'title', label: 'כותרת', required: true },
        { key: 'body', label: 'תוכן', type: 'textarea', required: true },
        { key: 'documentUrl', label: 'קישור למסמך (בעתיד: EmployeeRightsDocuments)' },
        { key: 'updatedAt', label: 'תאריך עדכון', type: 'date' },
      ]}
      newItem={() => ({ id: uid('er'), category: 'vacation', title: '', body: '', updatedAt: new Date().toISOString().slice(0, 10) })}
      onSave={(r) => upsert('employeeRights', r)} onDelete={(id) => remove('employeeRights', id)}
    />
  );
}

export function AdminBirthdays() {
  const { data, upsert, remove } = useData();
  return (
    <EntityManager<Birthday>
      title="ניהול ימי הולדת" icon={<Icon icon={Cake} size={16} />} items={data.birthdays}
      extraHeader={<Btn small variant="outline" onClick={() => alert('ייבוא מ-Excel (דמו) — בגרסה מלאה: קריאת קובץ xlsx')}><Icon icon={Download} size={14} /> ייבוא Excel</Btn>}
      columns={[
        { key: 'name', label: 'שם', render: (b) => `${b.emoji} ${b.name}` },
        { key: 'deptName', label: 'אגף' },
        { key: 'date', label: 'תאריך' },
      ]}
      fields={[
        { key: 'name', label: 'שם', required: true },
        { key: 'deptName', label: 'אגף' },
        { key: 'date', label: 'תאריך (DD/MM)', required: true },
        { key: 'emoji', label: 'אימוג׳י' },
      ]}
      newItem={() => ({ id: uid('b'), name: '', deptName: '', date: '', emoji: '🎂' })}
      onSave={(b) => upsert('birthdays', b)} onDelete={(id) => remove('birthdays', id)}
    />
  );
}
