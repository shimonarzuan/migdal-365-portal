import { useMemo, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel } from '@/shared/ui';
import { Icon, BarChart3 } from '@/shared/icons';
import { LazyMotion, domAnimation } from '@/shared/motion';
import CircularProgress from '@/shared/CircularProgress';

/**
 * מדדי ביצוע — 2 טבעות בלבד (לא 3): "טפסים שהושלמו" ו"מסמכים שנחתמו".
 * "שביעות רצון עובדים" הוסר במכוון — אין סקר כזה במערכת, ולא נציג מספר בדוי.
 * שני האחוזים מחושבים אך ורק מהגשות/הקצאות אמיתיות, מסוננות לפי שנה.
 */
export default function PerformanceMetrics() {
  const { data } = useData();

  const years = useMemo(() => {
    const ys = new Set<number>();
    data.formSubmissions.forEach((s) => ys.add(new Date(s.submittedAt).getFullYear()));
    data.rsAssignments.forEach((a) => ys.add(new Date(a.assignedAt).getFullYear()));
    const currentYear = new Date().getFullYear();
    ys.add(currentYear);
    return [...ys].filter((y) => !Number.isNaN(y)).sort((a, b) => b - a);
  }, [data.formSubmissions, data.rsAssignments]);

  const [year, setYear] = useState(() => new Date().getFullYear());

  const formsStats = useMemo(() => {
    const inYear = data.formSubmissions.filter((s) => new Date(s.submittedAt).getFullYear() === year);
    const decided = inYear.filter((s) => s.status !== 'pending').length;
    return { total: inYear.length, decided };
  }, [data.formSubmissions, year]);

  const signStats = useMemo(() => {
    const inYear = data.rsAssignments.filter((a) => new Date(a.assignedAt).getFullYear() === year);
    const approvedSet = new Set(data.rsApprovals.map((a) => `${a.documentId}::${a.employeeId}`));
    const signed = inYear.filter((a) => approvedSet.has(`${a.documentId}::${a.employeeId}`)).length;
    return { total: inYear.length, signed };
  }, [data.rsAssignments, data.rsApprovals, year]);

  const hasData = formsStats.total > 0 || signStats.total > 0;

  return (
    <Panel title="מדדי ביצוע" icon={<Icon icon={BarChart3} size={15} />}
           action={
             <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="בחירת שנה"
                     className="text-xs border border-[var(--border)] rounded-[var(--radius-md)] px-2 py-1 bg-[var(--surface)] cursor-pointer">
               {years.map((y) => <option key={y} value={y}>{y}</option>)}
             </select>
           }>
      {!hasData ? (
        <div className="py-6 flex flex-col items-center gap-1.5 text-center">
          <Icon icon={BarChart3} size={22} className="text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">אין נתונים עבור שנת {year}</p>
        </div>
      ) : (
        <LazyMotion features={domAnimation}>
          <div className="flex items-center justify-around gap-4 py-2">
            <CircularProgress
              value={formsStats.total ? (formsStats.decided / formsStats.total) * 100 : 0}
              label="טפסים שהושלמו" sublabel={`${formsStats.decided} מתוך ${formsStats.total}`}
              color="var(--primary)"
            />
            <CircularProgress
              value={signStats.total ? (signStats.signed / signStats.total) * 100 : 0}
              label="מסמכים שנחתמו" sublabel={`${signStats.signed} מתוך ${signStats.total}`}
              color="#0e7a5f"
            />
          </div>
        </LazyMotion>
      )}
    </Panel>
  );
}
