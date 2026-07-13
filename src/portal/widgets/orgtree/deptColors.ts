/** ─── צבע קבוע לכל אגף (שפת Fluent — גווני Microsoft 365) ─── */
export const DEPT_COLORS: Record<string, string> = {
  'mayor-office': '#0a58a3', 'mankal': '#4f46e5', 'education': '#16a34a', 'welfare': '#9333ea',
  'engineering': '#ea580c', 'hazut': '#dc2626', 'it': '#0891b2', 'gizbarut': '#ca8a04',
  'pikuach': '#92400e', 'shefah': '#db2777', 'committee': '#7c3aed', 'hr': '#059669',
  'security': '#b91c1c', 'klita': '#0d9488', 'moked': '#2563eb', 'gviya': '#a16207',
  'sachar': '#65a30d', 'hevra': '#c026d3', 'legal': '#475569', 'procurement': '#d97706',
  'yad-lebanim': '#6b7280', 'sherut': '#0284c7', 'mevaker': '#334155', 'other': '#94a3b8',
};

export const deptColor = (id: string): string => DEPT_COLORS[id] ?? '#94a3b8';

/** סדר תצוגה: הנהלה קודם */
export const DEPT_ORDER = ['mayor-office', 'mankal'];
