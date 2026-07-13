import { Icon, type LucideIcon } from '@/shared/icons';

/**
 * פריט Launcher — כפתור קומפקטי (אייקון בריבוע מרוכך + תווית), בסגנון
 * App Launcher של Microsoft 365. ללא צל/כרטיס גדול — Border עדין בלבד.
 */
export default function QuickTile({ icon, label, badge, onClick, color = 'var(--primary)' }: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-2 py-3.5
                 hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors duration-[var(--dur-fast)] cursor-pointer"
    >
      {badge ? (
        <span className="absolute top-1.5 left-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold grid place-items-center z-10">{badge}</span>
      ) : null}
      <span className="grid place-items-center size-10 rounded-[var(--radius-md)] transition-transform duration-[var(--dur-base)] group-hover:scale-105"
            style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }} aria-hidden>
        <Icon icon={icon} size={20} />
      </span>
      <span className="text-xs font-medium text-[var(--text-secondary)] text-center leading-tight group-hover:text-[var(--text)]">{label}</span>
    </button>
  );
}
