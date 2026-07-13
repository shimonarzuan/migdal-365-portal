import { useData } from '@/shared/DataContext';
import { SectionHeader } from '@/shared/ui';
import { Icon, ClipboardList, Network, Contact, LifeBuoy, Scale, Clock, ExternalLink, Sparkles, type LucideIcon } from '@/shared/icons';
import type { PageId } from '@/portal/layout/Sidebar';

/**
 * הפעולות המרכזיות — "מה תרצה לעשות היום?".
 * Config מסודר (PRIMARY_ACTIONS) → קל להוסיף/להסיר/לסדר מחדש בעתיד.
 * פעולה מסוג page מנווטת פנימית; פעולה מסוג systemId פותחת מערכת חיצונית
 * מתוך data.links (ללא URL מומצא — אם המערכת לא קיימת, הפעולה מוסתרת).
 */
type PrimaryAction = {
  id: string; title: string; desc: string; icon: LucideIcon; color: string;
} & ({ page: PageId } | { systemId: string });

export const PRIMARY_ACTIONS: PrimaryAction[] = [
  { id: 'self-service', title: 'שירות עצמי לעובד', desc: 'בקשות, טפסים ומעקב אחר תהליכים', icon: ClipboardList, color: 'var(--primary)', page: 'forms' },
  { id: 'employee-search', title: 'חיפוש עובד', desc: 'איתור עובדים, תפקידים ופרטי קשר', icon: Network, color: '#0e7490', page: 'orgtree' },
  { id: 'phonebook', title: 'ספר טלפונים', desc: 'טלפונים של עובדים, אגפים ומחלקות', icon: Contact, color: '#7c3aed', page: 'contacts' },
  { id: 'helpdesk', title: 'פתיחת קריאת שירות', desc: 'דיווח תקלה וקבלת תמיכה', icon: LifeBuoy, color: '#ea580c', systemId: 'sys-helpdesk' },
  { id: 'rights', title: 'דע את זכויותיך', desc: 'מידע, זכויות והטבות לעובדי העירייה', icon: Scale, color: '#946f00', page: 'rights' },
  { id: 'reception', title: 'קבלת קהל', desc: 'שעות פעילות ודרכי התקשרות', icon: Clock, color: '#0f766e', page: 'reception' },
];

export default function HomePrimaryActions({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { data } = useData();

  const resolve = (a: PrimaryAction): { onClick: () => void; external: boolean } | null => {
    if ('page' in a) return { onClick: () => onNavigate(a.page), external: false };
    const sys = data.links.find((l) => l.id === a.systemId);
    if (!sys) return null; // מערכת לא מוגדרת — לא מציגים קישור מת
    return { onClick: () => window.open(sys.url, '_blank', 'noopener,noreferrer'), external: true };
  };

  const actions = PRIMARY_ACTIONS.map((a) => ({ a, r: resolve(a) })).filter((x) => x.r);

  return (
    <section>
      <SectionHeader title="מה תרצה לעשות היום?" icon={<Icon icon={Sparkles} size={15} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map(({ a, r }) => (
          <button
            key={a.id}
            onClick={r!.onClick}
            aria-label={r!.external ? `${a.title} — נפתח בכרטיסייה חדשה` : a.title}
            className="group relative text-right flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4
                       hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
                       transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] cursor-pointer"
          >
            <span className="shrink-0 grid place-items-center size-11 rounded-[var(--radius-md)] transition-transform duration-[var(--dur-base)] group-hover:scale-105"
                  style={{ background: `color-mix(in srgb, ${a.color} 12%, white)`, color: a.color }} aria-hidden>
              <Icon icon={a.icon} size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
                {a.title}
                {r!.external && <Icon icon={ExternalLink} size={13} className="text-[var(--text-muted)]" />}
              </strong>
              <span className="block text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">{a.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
