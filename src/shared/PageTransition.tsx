import type { ReactNode } from 'react';
import { LazyMotion, domAnimation, m, motionTokens } from './motion';

/**
 * עוטף תוכן דף (מפתח = pageKey) ב-fade + הזזה אנכית קלה בכניסה.
 * במכוון אנכי בלבד (לא slide אופקי) — אין מושג back/forward אמיתי ב-router
 * מבוסס ה-useState הקיים, וכיוון אופקי היה דורש היפוך ב-RTL ללא תועלת ברורה.
 * במכוון בלי mode="wait": זהו ניתוב העל של כל האפליקציה — המתנה ליציאה
 * שנחסמת (למשל בטאב לא-פעיל, שם requestAnimationFrame מוקפא) הייתה תוקעת
 * את הניווט כולו במסך הישן לצמיתות. לכן רק כניסת התוכן החדש מונפשת;
 * היציאה הישנה פשוט נעלמת (unmount רגיל) — עמיד גם בתנאים לא אידיאליים.
 * לא נוגע בלוגיקת הניווט עצמה — עוטף בלבד.
 */
export default function PageTransition({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        key={pageKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
