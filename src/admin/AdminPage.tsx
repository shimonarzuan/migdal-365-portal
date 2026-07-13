import { useState } from 'react';
import type { Permission } from '@/types';
import { useData } from '@/shared/DataContext';
import { ROLES } from '@/data/roles';
import { Badge, Field, inputCls, Panel, PageHeader, StatCard } from '@/shared/ui';
import { Icon, Settings, FileSignature, Palette, Plug, BarChart3, Users, Building2, FolderClosed, Megaphone, ListChecks, Rocket, Cake, Scale, ClipboardList, ShieldCheck, FileText, GraduationCap, type LucideIcon } from '@/shared/icons';
import { useToast } from '@/shared/Toast';
import AdminEmployees from './AdminEmployees';
import AdminReadSign from './AdminReadSign';
import AdminAudit from './AdminAudit';
import AdminFormsManager from './forms/AdminFormsManager';
import AdminLearning from './AdminLearning';
import { AdminDepartments, AdminProcedures, AdminAnnouncements, AdminTasks, AdminLinks, AdminBirthdays, AdminEmployeeRights } from './AdminEntities';

type SectionId = 'dashboard' | 'employees' | 'departments' | 'procedures' | 'readsign' | 'announcements' | 'tasks' | 'links' | 'birthdays' | 'employeeRights' | 'forms' | 'learning' | 'permissions' | 'audit' | 'settings';

/** כל מקטע מוגדר עם ההרשאה הנדרשת לו — נבדק מול permissionService */
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; permission: Permission }[] = [
  { id: 'dashboard', label: 'סקירה', icon: BarChart3, permission: 'admin.access' },
  { id: 'employees', label: 'עובדים', icon: Users, permission: 'employees.manage' },
  { id: 'departments', label: 'אגפים', icon: Building2, permission: 'departments.manage' },
  { id: 'procedures', label: 'נהלים', icon: FolderClosed, permission: 'procedures.manage' },
  { id: 'readsign', label: 'קרא וחתום', icon: FileSignature, permission: 'readsign.manage' },
  { id: 'announcements', label: 'הודעות', icon: Megaphone, permission: 'announcements.manage' },
  { id: 'tasks', label: 'משימות', icon: ListChecks, permission: 'tasks.manage' },
  { id: 'links', label: 'קישורים', icon: Rocket, permission: 'links.manage' },
  { id: 'birthdays', label: 'ימי הולדת', icon: Cake, permission: 'birthdays.manage' },
  { id: 'employeeRights', label: 'זכויות עובדים', icon: Scale, permission: 'employeeRights.manage' },
  { id: 'forms', label: 'טפסים', icon: ClipboardList, permission: 'forms.manage' },
  { id: 'learning', label: 'לומדה', icon: GraduationCap, permission: 'learning.manage' },
  { id: 'permissions', label: 'הרשאות', icon: ShieldCheck, permission: 'permissions.manage' },
  { id: 'audit', label: 'יומן ביקורת', icon: FileText, permission: 'audit.view' },
  { id: 'settings', label: 'הגדרות', icon: Settings, permission: 'settings.manage' },
];

/** פאנל ניהול — כל מקטע וכל פעולה נבדקים מול permissionService (RBAC) */
export default function AdminPage({ onOpenEmployee }: { onOpenEmployee: (id: string) => void }) {
  const { can, role } = useData();
  const allowed = SECTIONS.filter((s) => can(s.permission));
  const [section, setSection] = useState<SectionId>(allowed[0]?.id ?? 'dashboard');

  if (!can('admin.access')) {
    return (
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-10 text-center">
        <div className="mb-2 flex justify-center text-[var(--text-muted)]"><Icon icon={ShieldCheck} size={36} /></div>
        <h1 className="text-lg font-bold text-[var(--text)]">אזור מוגבל</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">פאנל הניהול זמין לבעלי הרשאות ניהול בלבד. ההרשאה שלך: {role.label}.</p>
      </div>
    );
  }

  const active = allowed.some((s) => s.id === section) ? section : allowed[0].id;

  return (
    <div className="space-y-4">
      <PageHeader title="פאנל ניהול" icon={<Icon icon={Settings} size={20} />} subtitle={`מחובר כ-${role.label} · ${allowed.length} מקטעים זמינים`} />
      <nav className="flex gap-1.5 flex-wrap" aria-label="מקטעי ניהול">
        {allowed.map((t) => (
          <button key={t.id} onClick={() => setSection(t.id)} aria-pressed={active === t.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${active === t.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'}`}>
            <Icon icon={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </nav>

      {active === 'dashboard' && <AdminDashboard />}
      {active === 'employees' && <AdminEmployees onOpenEmployee={onOpenEmployee} />}
      {active === 'departments' && <AdminDepartments />}
      {active === 'procedures' && <AdminProcedures />}
      {active === 'readsign' && <AdminReadSign />}
      {active === 'announcements' && <AdminAnnouncements />}
      {active === 'tasks' && <AdminTasks />}
      {active === 'links' && <AdminLinks />}
      {active === 'birthdays' && <AdminBirthdays />}
      {active === 'employeeRights' && <AdminEmployeeRights />}
      {active === 'forms' && <AdminFormsManager />}
      {active === 'learning' && <AdminLearning />}
      {active === 'permissions' && <AdminPermissions />}
      {active === 'audit' && <AdminAudit />}
      {active === 'settings' && <AdminSettings />}
    </div>
  );
}

function AdminDashboard() {
  const { data } = useData();
  const publishedDocs = data.rsDocuments.filter((d) => d.status === 'published');
  const approvedCount = data.rsApprovals.length;
  const assignedCount = data.rsAssignments.length;
  const kpis: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: 'עובדים באלפון', value: data.employees.length, icon: Users, color: 'var(--primary)' },
    { label: 'אגפים', value: data.departments.length, icon: Building2, color: '#0e7490' },
    { label: 'נהלים', value: data.procedures.length, icon: FolderClosed, color: '#946f00' },
    { label: 'הודעות פעילות', value: data.announcements.length, icon: Megaphone, color: '#7c3aed' },
    { label: 'משימות פתוחות', value: data.tasks.filter((t) => !t.done).length, icon: ListChecks, color: '#16a34a' },
    { label: 'חתימות חסרות', value: Math.max(0, assignedCount - approvedCount), icon: FileSignature, color: '#ea580c' },
    { label: 'טפסים ממתינים', value: data.formSubmissions.filter((s) => s.status === 'pending').length, icon: ClipboardList, color: 'var(--primary-dark)' },
    { label: 'לומדות הושלמו', value: data.learningCompletions.filter((c) => c.completedAt).length, icon: GraduationCap, color: '#0e9f6e' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {kpis.map((k) => (
          <StatCard key={k.label} icon={<Icon icon={k.icon} size={18} />} value={k.value} label={k.label} color={k.color} />
        ))}
      </div>
      {publishedDocs.length > 0 && (
        <Panel title="מסמכי קרא וחתום פעילים" icon={<Icon icon={FileSignature} size={15} />}>
          <ul className="space-y-1.5 text-sm">
            {publishedDocs.map((d) => {
              const assigned = data.rsAssignments.filter((a) => a.documentId === d.id).length;
              const approved = data.rsApprovals.filter((a) => a.documentId === d.id).length;
              return (
                <li key={d.id} className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">{d.title}</span>
                  <Badge tone={approved === assigned ? 'success' : 'warning'}>{approved}/{assigned} חתמו</Badge>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function AdminPermissions() {
  const { data, upsert, audit, can } = useData();
  const toast = useToast();
  const [q, setQ] = useState('');
  if (!can('permissions.manage')) return null;
  const results = data.employees
    .filter((u) => !q.trim() || u.name.includes(q) || u.title.includes(q))
    .sort((a, b) => (a.roleId === 'admin' ? -1 : 1) - (b.roleId === 'admin' ? -1 : 1) || a.name.localeCompare(b.name, 'he'));
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        פיתוח: ההרשאות מקובץ הנתונים · ייצור: מקבוצות Entra ID (ראו src/config/entraGroups.config.ts) — שינוי כאן משפיע על מצב הפיתוח בלבד.
      </p>
      <section className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="p-3 border-b border-[var(--border)]">
          <input type="search" className={inputCls} placeholder="חיפוש עובד…" aria-label="חיפוש עובד" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-[var(--text-muted)] border-b border-[var(--border)] sticky top-0 bg-[var(--surface)]">
                <th className="px-4 py-2.5 font-medium">עובד/ת</th>
                <th className="px-4 py-2.5 font-medium">אגף</th>
                <th className="px-4 py-2.5 font-medium">הרשאה</th>
              </tr>
            </thead>
            <tbody>
              {results.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/60 hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-2">{u.name} <span className="text-xs text-[var(--text-muted)]">· {u.title}</span></td>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{data.departments.find((d) => d.id === u.deptId)?.name ?? '—'}</td>
                  <td className="px-4 py-2">
                    <select value={u.roleId} aria-label={`הרשאה עבור ${u.name}`}
                            onChange={(e) => {
                              const roleId = e.target.value as typeof u.roleId;
                              upsert('employees', { ...u, roleId });
                              audit('roleChanged', 'employee', u.id, { role: u.roleId }, { role: roleId });
                              toast.success(`ההרשאה של ${u.name} עודכנה ל-${ROLES[roleId].label}`);
                            }}
                            className="rounded-[var(--radius-md)] border border-[var(--border)] px-2 py-1.5 text-xs bg-[var(--surface)]">
                      {Object.values(ROLES).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminSettings() {
  const { settings, updateSettings, can } = useData();
  if (!can('settings.manage')) return null;
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <Panel title="מיתוג הרשות" icon={<Icon icon={Palette} size={15} />}>
        <div className="space-y-3">
          <Field label="שם הרשות">
            <input className={inputCls} value={settings.municipalityName} onChange={(e) => updateSettings({ municipalityName: e.target.value })} />
          </Field>
          <Field label="שם המערכת">
            <input className={inputCls} value={settings.productName} onChange={(e) => updateSettings({ productName: e.target.value })} />
          </Field>
          <Field label="כתובת לוגו (URL)">
            <input className={inputCls} value={settings.logoUrl ?? ''} placeholder="/logo.svg" onChange={(e) => updateSettings({ logoUrl: e.target.value || null })} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            {(['primary', 'primaryDark', 'sky'] as const).map((k) => (
              <Field key={k} label={k === 'primary' ? 'טורקיז ראשי' : k === 'primaryDark' ? 'טורקיז כהה' : 'תכלת'}>
                <input type="color" className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--border)] cursor-pointer"
                       value={settings.colors[k]}
                       onChange={(e) => updateSettings({ colors: { ...settings.colors, [k]: e.target.value } })} />
              </Field>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">השינויים חלים מיידית על כל המערכת (CSS Variables).</p>
        </div>
      </Panel>

      <Panel title="חיבורים ואינטגרציות" icon={<Icon icon={Plug} size={15} />}>
        <div className="space-y-3">
          {([
            ['smtp', 'שרת SMTP (תזכורות דוא"ל)', 'smtp.migdal-haemeq.muni.il'],
            ['m365Tenant', 'Microsoft 365 Tenant', 'contoso.onmicrosoft.com'],
            ['sharepointUrl', 'SharePoint Online (מאגר נהלים)', 'https://tenant.sharepoint.com/sites/portal'],
            ['entraIdTenant', 'Entra ID (SSO)', 'tenant-id'],
          ] as const).map(([key, label, ph]) => (
            <Field key={key} label={label}>
              <input className={inputCls} placeholder={ph} value={settings.integrations[key] ?? ''}
                     onChange={(e) => updateSettings({ integrations: { ...settings.integrations, [key]: e.target.value } })} />
            </Field>
          ))}
          <p className="text-xs text-[var(--text-muted)]">ההגדרות המבצעיות נמצאות ב-.env (ראו .env.example) — כאן תיעוד/תצוגה בלבד.</p>
        </div>
      </Panel>
    </div>
  );
}
