const HE = 'he-IL';

/** תאריך עברי מלא, למשל: י"ח בתמוז תשפ"ו */
export function hebrewDate(date = new Date()): string {
  return new Intl.DateTimeFormat(`${HE}-u-ca-hebrew`, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** תאריך לועזי מלא, למשל: יום שישי, 3 ביולי 2026 */
export function gregorianDate(date = new Date()): string {
  return new Intl.DateTimeFormat(HE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** ברכה לפי שעה */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

/** זמן יחסי — "לפני 10 דקות" / "אתמול" / תאריך מלא כשעבר יותר משבוע */
export function timeAgo(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = now.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'עכשיו';
  if (min < 60) return `לפני ${min} דקות`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'אתמול';
  if (day < 7) return `לפני ${day} ימים`;
  return new Intl.DateTimeFormat(HE, { day: 'numeric', month: 'short' }).format(d);
}
