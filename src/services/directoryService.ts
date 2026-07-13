import type { Employee, DeptMeta, Procedure, LinkItem } from '@/types';

/**
 * ─── directoryService — חיפוש מרכזי אחיד ────────────────────────────────────
 * מנוע החיפוש של הפורטל: עובדים, אגפים, נהלים ומערכות, בכפוף להרשאות.
 * בעתיד: החלפה במנוע AI (Copilot / Azure OpenAI) באותו חוזה.
 */

export interface SearchSource {
  employees: Employee[];
  departments: DeptMeta[];
  procedures: Procedure[];
  links: LinkItem[];
}

export interface SearchResult {
  icon: string;
  title: string;
  sub: string;
  kind: 'department' | 'procedure' | 'employee' | 'link';
  targetId: string; // deptId / url
}

export function searchDirectory(
  src: SearchSource,
  term: string,
  canSeeInternal: (deptId: string) => boolean,
  limit = 8,
): SearchResult[] {
  const q = term.trim();
  if (q.length < 2) return [];
  const out: SearchResult[] = [];

  for (const d of src.departments) {
    if (d.name.includes(q)) out.push({ icon: d.icon, title: `אגף ${d.name}`, sub: d.description, kind: 'department', targetId: d.id });
  }
  for (const p of src.procedures) {
    if (p.internal && !canSeeInternal(p.deptId)) continue;
    if (p.title.includes(q) || p.description.includes(q)) {
      const dn = src.departments.find((d) => d.id === p.deptId)?.name ?? '';
      out.push({ icon: '📄', title: p.title, sub: `נוהל · אגף ${dn}`, kind: 'procedure', targetId: p.deptId });
    }
  }
  for (const c of src.employees) {
    if (c.name.includes(q) || c.title.includes(q))
      out.push({ icon: '👤', title: c.name, sub: `${c.title} · ${c.mobile || c.ext}`, kind: 'employee', targetId: c.id });
  }
  for (const s of src.links) {
    if (s.title.includes(q)) out.push({ icon: s.icon ?? '🔗', title: s.title, sub: 'מערכת', kind: 'link', targetId: s.url });
  }
  return out.slice(0, limit);
}
