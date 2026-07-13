import type { ReactNode } from 'react';
import { useData } from '@/shared/DataContext';
import Sidebar, { type PageId } from './Sidebar';
import Topbar from './Topbar';

/** מעטפת בסגנון M365 Admin Center: Header עליון + תפריט צד קבוע + אזור תוכן מתחלף */
export default function AppShell({ page, onNavigate, onOpenDept, children }: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  onOpenDept: (deptId: string) => void;
  children: ReactNode;
}) {
  const { settings } = useData();

  return (
    <div
      className="min-h-screen flex flex-col bg-[var(--app-bg)]"
      style={{
        ['--primary' as string]: settings.colors.primary,
        ['--primary-dark' as string]: settings.colors.primaryDark,
        ['--accent' as string]: settings.colors.accent,
        ['--sky' as string]: settings.colors.sky,
      }}
    >
      <Topbar onOpenDept={onOpenDept} onNavigate={onNavigate} page={page} />

      <div className="flex flex-1 w-full max-w-[1400px] mx-auto">
        <Sidebar page={page} onNavigate={onNavigate} />
        <main className="flex-1 min-w-0 p-3 sm:p-5 pb-24 md:pb-8">{children}</main>
      </div>

      <footer className="hidden md:block text-center text-xs text-slate-400 py-4 border-t border-slate-200 bg-white">
        {settings.productName} · {settings.municipalityName} · פורטל עובדים פנימי · {new Date().getFullYear()} ·
        <span className="mx-1">נבנה על ידי אגף מערכות מידע</span>
      </footer>
    </div>
  );
}
