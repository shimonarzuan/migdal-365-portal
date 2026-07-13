import {
  LayoutDashboard, Building2, Network, Contact, FolderClosed, Scale,
  ClipboardList, FileSignature, Clock, LayoutGrid, BarChart3, Settings,
  Search, Bell, CircleHelp, LogOut, Menu, ChevronLeft, ChevronDown, ChevronRight,
  ChevronsLeft, ListChecks, ClipboardCheck, Megaphone, FileText, Plus, X,
  Phone, Mail, MessagesSquare, MapPin, Calendar, ExternalLink, AlertTriangle,
  Inbox, Activity, Copy, PenLine, Cake, Sparkles, Users, ShieldCheck,
  ArrowLeft, Check, Building, Newspaper, UserRound, LifeBuoy, Info,
  Palette, Plug, Wrench, BookOpen, Rocket, Send, Trash2, Pencil, Upload, Download,
  GraduationCap, PlayCircle,
  type LucideIcon,
} from 'lucide-react';

/**
 * מערכת אייקונים מרכזית — Lucide (stroke 1.75, גודל אחיד).
 * מקור אמת יחיד: כל האפליקציה מייבאת מכאן, כך שהחלפת ספרייה/אייקון היא נקודתית.
 * ללא אימוג'י כאייקונים מבניים.
 */
export function Icon({ icon: I, size = 18, strokeWidth = 1.75, className, style }: {
  icon: LucideIcon; size?: number; strokeWidth?: number; className?: string; style?: import('react').CSSProperties;
}) {
  return <I size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden />;
}

export type { LucideIcon };

/** אייקוני ניווט לפי PageId */
export const NAV_ICONS = {
  home: LayoutDashboard,
  departments: Building2,
  orgtree: Network,
  contacts: Contact,
  procedures: FolderClosed,
  rights: Scale,
  forms: ClipboardList,
  readsign: FileSignature,
  learning: GraduationCap,
  reception: Clock,
  systems: LayoutGrid,
  reports: BarChart3,
  admin: Settings,
} as const;

// re-export הנפוצים לשימוש ישיר
export {
  LayoutDashboard, Building2, Building, Network, Contact, FolderClosed, Scale,
  ClipboardList, FileSignature, Clock, LayoutGrid, BarChart3, Settings,
  Search, Bell, CircleHelp, LogOut, Menu, ChevronLeft, ChevronDown, ChevronRight,
  ChevronsLeft, ListChecks, ClipboardCheck, Megaphone, FileText, Plus, X,
  Phone, Mail, MessagesSquare, MapPin, Calendar, ExternalLink, AlertTriangle,
  Inbox, Activity, Copy, PenLine, Cake, Sparkles, Users, ShieldCheck, ArrowLeft, Check,
  Newspaper, UserRound, LifeBuoy, Info, Palette, Plug, Wrench, BookOpen, Rocket,
  Send, Trash2, Pencil, Upload, Download, GraduationCap, PlayCircle,
};
