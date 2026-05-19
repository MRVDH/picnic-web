/**
 * Dutch date/time formatting for delivery slot windows.
 *
 * Uses explicit day-name and month-abbreviation maps (not Intl) to avoid
 * locale-dependent behaviour differences across environments.
 */

const DUTCH_DAY_NAMES = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
] as const;

const DUTCH_MONTH_ABBREVIATIONS = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

/** Prompt text shown when no explicit slot selection exists. */
export const NO_SLOT_TEXT = "Kies je bezorgmoment";

/**
 * Format a delivery window for the cart banner.
 * Returns e.g. "Morgen 14:40 - 15:40", "Vandaag 08:00 - 09:00".
 */
export function formatBannerText(windowStart: string | null, windowEnd: string | null): string {
  if (!windowStart || !windowEnd) return NO_SLOT_TEXT;

  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const dayLabel = getRelativeDayLabel(start);
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return `${dayLabel} ${startTime} - ${endTime}`;
}

/**
 * Format a day tab label for the picker.
 * Returns { dayLabel: "Morgen", dateLabel: "16 apr" }.
 */
export function formatDayTabLabel(dateStr: string): {
  dayLabel: string;
  dateLabel: string;
} {
  const date = new Date(dateStr + "T12:00:00");
  const dayLabel = getRelativeDayLabel(date);
  const day = date.getDate();
  const month = DUTCH_MONTH_ABBREVIATIONS[date.getMonth()];
  return { dayLabel, dateLabel: `${day} ${month}` };
}

/** Format HH:MM from a Date in local time. */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "Vandaag", "Morgen", or Dutch day name. */
function getRelativeDayLabel(date: Date): string {
  const today = new Date();
  const todayDate = toDateString(today);
  const tomorrowDate = toDateString(addDays(today, 1));
  const targetDate = toDateString(date);

  if (targetDate === todayDate) return "Vandaag";
  if (targetDate === tomorrowDate) return "Morgen";
  return DUTCH_DAY_NAMES[date.getDay()];
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
