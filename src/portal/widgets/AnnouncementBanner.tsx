import { useEffect, useState } from 'react';
import { useData } from '@/shared/DataContext';
import { activeAnnouncements } from '@/services/announcementService';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from '@/shared/motion';

const AUTO_SCROLL_MS = 6000;

/**
 * כרטיס פרסומי — Carousel אמיתי על הודעות kind='banner' (שדה קיים בסכימה,
 * לא מוצג היום באף מקום). רקע גרדיאנט (לא תמונה מומצאת). מוסתר לגמרי אם
 * אין הודעות מסוג זה — לא ממציא תוכן כשאין.
 */
export default function AnnouncementBanner() {
  const { data } = useData();
  const banners = activeAnnouncements(data.announcements.filter((a) => a.kind === 'banner'));
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), AUTO_SCROLL_MS);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;
  const current = banners[i % banners.length];

  return (
    <LazyMotion features={domAnimation}>
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0a2a4d] via-[var(--primary-dark)] to-[var(--primary)] text-white shadow-md"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label="הודעות עירייה"
      >
        <div className="float-shape absolute -top-10 -right-6 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" aria-hidden />
        <AnimatePresence mode="wait">
          <m.div
            key={current.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
            className="relative px-5 py-5 sm:px-8 sm:py-6"
          >
            <h3 className="text-xs font-bold opacity-75 mb-1">חדשות העירייה</h3>
            <h2 className="text-lg sm:text-xl font-extrabold">{current.title}</h2>
            <p className="text-sm opacity-85 mt-1.5 max-w-xl">{current.body}</p>
          </m.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <div className="relative flex items-center justify-center gap-3 pb-4">
            {/* חצים מותאמים לכיוון קריאה RTL — "הקודם" (מימין) מצביע ימינה, "הבא" (משמאל) מצביע שמאלה */}
            <button onClick={() => setI((v) => (v - 1 + banners.length) % banners.length)} aria-label="הקודם"
                    className="size-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer">›</button>
            <span className="flex gap-1.5">
              {banners.map((b, idx) => (
                <button key={b.id} onClick={() => setI(idx)} aria-label={`מעבר לשקופית ${idx + 1}`}
                        className={`size-1.5 rounded-full transition-all duration-[var(--dur-base)] cursor-pointer ${idx === i % banners.length ? 'bg-white w-4' : 'bg-white/40'}`} />
              ))}
            </span>
            <button onClick={() => setI((v) => (v + 1) % banners.length)} aria-label="הבא"
                    className="size-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer">‹</button>
          </div>
        )}
      </section>
    </LazyMotion>
  );
}
