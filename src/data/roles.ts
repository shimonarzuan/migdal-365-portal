import type { Role, RoleId, LinkItem } from '@/types';

// ─── תפקידים והרשאות ────────────────────────────────────────────────────────
export const ROLES: Record<RoleId, Role> = {
  employee:     { id: 'employee',     label: 'עובד/ת',       canSeeInternal: false, canEdit: false, allDepartments: false },
  deptManager:  { id: 'deptManager',  label: 'מנהל/ת אגף',   canSeeInternal: true,  canEdit: true,  allDepartments: false },
  spokesperson: { id: 'spokesperson', label: 'דוברות',       canSeeInternal: true,  canEdit: true,  allDepartments: false },
  hr:           { id: 'hr',           label: 'משאבי אנוש',   canSeeInternal: true,  canEdit: true,  allDepartments: false },
  it:           { id: 'it',           label: 'מערכות מידע',  canSeeInternal: true,  canEdit: true,  allDepartments: true },
  admin:        { id: 'admin',        label: 'מנהל/ת מערכת', canSeeInternal: true,  canEdit: true,  allDepartments: true },
};

// ─── קישורי Microsoft 365 ───────────────────────────────────────────────────
export const m365Links: LinkItem[] = [
  { id: 'm365-teams', title: 'Teams', url: 'https://teams.microsoft.com', icon: '💬' },
  { id: 'm365-outlook', title: 'Outlook', url: 'https://outlook.office.com', icon: '📧' },
  { id: 'm365-powerbi', title: 'Power BI', url: 'https://app.powerbi.com', icon: '📈' },
];
