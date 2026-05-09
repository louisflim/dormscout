/** Minimum full calendar days after today that move-in / move-out may be scheduled. */
export const MIN_BOOKING_ADVANCE_DAYS = 3;

export function formatLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Earliest allowed move-in date (local): today + MIN_BOOKING_ADVANCE_DAYS */
export function getMinSchedulableDateYmd() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + MIN_BOOKING_ADVANCE_DAYS);
  return formatLocalYmd(t);
}

/**
 * Parse a calendar date as local midnight.
 * Accepts "YYYY-MM-DD" or ISO strings like "YYYY-MM-DDTHH:mm:ss.sssZ" (uses date part only).
 */
export function parseLocalYmd(ymd) {
  if (ymd == null) return null;
  if (ymd instanceof Date && !Number.isNaN(ymd.getTime())) {
    return new Date(ymd.getFullYear(), ymd.getMonth(), ymd.getDate(), 0, 0, 0, 0);
  }
  if (typeof ymd !== 'string') return null;
  const datePart = ymd.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const [y, m, d] = datePart.split('-').map((n) => Number(n));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** True if date string is on or after (today + minDays) in local calendar */
export function isAtLeastDaysFromToday(ymd, minDays = MIN_BOOKING_ADVANCE_DAYS) {
  const target = parseLocalYmd(ymd);
  if (!target) return false;
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + minDays);
  return target.getTime() >= min.getTime();
}
