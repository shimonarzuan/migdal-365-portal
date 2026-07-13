import { useData } from '@/shared/DataContext';
import { SectionHeader } from '@/shared/ui';
import { Icon, LayoutGrid, MessagesSquare, Mail, BarChart3, Phone, MapPin, Building, LifeBuoy, ExternalLink, ChevronLeft, type LucideIcon } from '@/shared/icons';
import type { LinkItem } from '@/types';
import type { PageId } from '@/portal/layout/Sidebar';

const PREVIEW = 8;

/** מיפוי שם מערכת → אייקון Lucide מזוהה (ללא אימוג'י) */
function systemIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes('teams')) return MessagesSquare;
  if (t.includes('outlook') || t.includes('מייל') || t.includes('דוא')) return Mail;
  if (t.includes('bi') || t.includes('דוח')) return BarChart3;
  if (t.includes('crm') || t.includes('מוקד')) return Phone;
  if (t.includes('gis') || t.includes('מפ')) return MapPin;
  if (t.includes('תלת') || t.includes('3d') || t.includes('סימפלקס')) return Building;
  if (t.includes('קריא') || t.includes('תקל') || t.includes('תמיכ') || t.includes('helpdesk')) return LifeBuoy;
  return LayoutGrid;
}

/** אזור "המערכות שלי" — קיצורי דרך למערכות חיצוניות מתוך data.links (Config). */
export default function HomeSystemsLinks({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { data } = useData();
  const systems: LinkItem[] = data.links.slice(0, PREVIEW);
  if (systems.length === 0) return null;

  return (
    <section>
      <SectionHeader title="המערכות שלי" icon={<Icon icon={LayoutGrid} size={15} />}
        action={data.links.length > PREVIEW
          ? <button onClick={() => onNavigate('systems')} className="text-xs text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-0.5">לכל המערכות <Icon icon={ChevronLeft} size={13} /></button>
          : undefined} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {systems.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
             aria-label={`${s.title} — נפתח בכרטיסייה חדשה`}
             className="group relative flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5
                        hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors duration-[var(--dur-fast)]">
            <span className="shrink-0 grid place-items-center size-8 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--primary)]" aria-hidden>
              <Icon icon={systemIcon(s.title)} size={17} />
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text)] truncate">{s.title}</span>
            <Icon icon={ExternalLink} size={13} className="text-[var(--text-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </section>
  );
}
