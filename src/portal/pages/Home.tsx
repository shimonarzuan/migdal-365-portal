import { useData } from '@/shared/DataContext';
import { activeAnnouncements } from '@/services/announcementService';
import type { PageId } from '@/portal/layout/Sidebar';
import { Icon, AlertTriangle } from '@/shared/icons';
import HomeWelcomeSummary from '@/portal/widgets/HomeWelcomeSummary';
import HomePrimaryActions from '@/portal/widgets/HomePrimaryActions';
import HomeSystemsLinks from '@/portal/widgets/HomeSystemsLinks';
import HomeOrganizationalUpdates from '@/portal/widgets/HomeOrganizationalUpdates';
import HomeProceduresAndSign from '@/portal/widgets/HomeProceduresAndSign';

/**
 * דף הבית — מסך עבודה ארגוני, מסודר לפי סדר השימוש של העובד (5 אזורים):
 * 1. ברכה + סטטוס · 2. מה תרצה לעשות · 3. המערכות שלי ·
 * 4. מידע ארגוני · 5. נהלים וקרא-וחתום. נתוני אמת בלבד.
 */
export default function Home({ onNavigate }: {
  onNavigate: (p: PageId) => void;
  onOpenDept?: (id: string) => void;
}) {
  const { data } = useData();
  const emergency = activeAnnouncements(data.announcements).filter((a) => a.type === 'emergency');

  return (
    <div className="space-y-8">
      {/* הודעת חירום — מוצגת רק כשקיימת */}
      {emergency.map((a) => (
        <div key={a.id} role="alert" className="bg-[var(--danger-bg)] border border-[var(--danger)]/30 rounded-[var(--radius-lg)] px-4 py-3 flex items-start gap-3">
          <Icon icon={AlertTriangle} size={20} className="text-[var(--danger)] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm text-[var(--danger-text)]">{a.title}</strong>
            <p className="text-xs text-[var(--text-secondary)]">{a.body}</p>
          </div>
        </div>
      ))}

      {/* 1 · ברכה אישית + סטטוס */}
      <HomeWelcomeSummary onNavigate={onNavigate} />

      {/* 2 · מה תרצה לעשות היום? */}
      <HomePrimaryActions onNavigate={onNavigate} />

      {/* 3 · המערכות שלי */}
      <HomeSystemsLinks onNavigate={onNavigate} />

      {/* 4 · מידע ארגוני */}
      <HomeOrganizationalUpdates />

      {/* 5 · נהלים וקרא וחתום */}
      <HomeProceduresAndSign onNavigate={onNavigate} />
    </div>
  );
}
