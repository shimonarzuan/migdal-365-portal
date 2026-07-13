/**
 * מצבי טעינה — פעימת opacity טהורה (לא background-position) כדי לשמור בקפדנות
 * על הכלל "transform/opacity בלבד". מוגדר כ-CSS ב-styles.css (.skeleton-pulse).
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden />;
}

/** מחליף את טקסט הטעינה הגנרי של Suspense — מדמה שלד עמוד (כותרת + כרטיסים) */
export function PageSkeleton() {
  return (
    <div className="space-y-4 py-2" role="status" aria-label="טוען תוכן">
      <SkeletonBlock className="h-6 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
