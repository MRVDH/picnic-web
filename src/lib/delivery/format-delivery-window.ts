/**
 * Date/time formatting for delivery slot windows.
 *
 * Uses explicit per-country day-name and month-abbreviation maps (not Intl) to
 * avoid locale-dependent behaviour differences across environments, keyed by
 * the same CountryCode the rest of the app uses.
 */
import type { CountryCode } from "@/lib/core/types";

const DAY_NAMES: Record<CountryCode, readonly string[]> = {
  NL: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  DE: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  FR: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
};

const MONTH_ABBREVIATIONS: Record<CountryCode, readonly string[]> = {
  NL: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  DE: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  FR: ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"],
};

const MONTH_NAMES: Record<CountryCode, readonly string[]> = {
  NL: [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ],
  DE: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  FR: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
};

const RELATIVE_LABELS: Record<CountryCode, { today: string; tomorrow: string }> = {
  NL: { today: "Vandaag", tomorrow: "Morgen" },
  DE: { today: "Heute", tomorrow: "Morgen" },
  FR: { today: "Aujourd'hui", tomorrow: "Demain" },
};

/**
 * Format a delivery window for the cart banner.
 * Returns e.g. "Morgen 14:40 - 15:40", "Vandaag 08:00 - 09:00", or null when
 * the window is incomplete (the caller substitutes the "pick a slot" prompt).
 */
export function formatBannerText(
  windowStart: string | null,
  windowEnd: string | null,
  countryCode: CountryCode
): string | null {
  if (!windowStart || !windowEnd) return null;

  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const dayLabel = getRelativeDayLabel(start, countryCode);
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return `${dayLabel} ${startTime} - ${endTime}`;
}

/**
 * Format a day tab label for the picker.
 * Returns { dayLabel: "Morgen", dateLabel: "16 apr" }.
 */
export function formatDayTabLabel(
  dateStr: string,
  countryCode: CountryCode
): {
  dayLabel: string;
  dateLabel: string;
} {
  const date = new Date(dateStr + "T12:00:00");
  const dayLabel = getRelativeDayLabel(date, countryCode);
  const day = date.getDate();
  const month = MONTH_ABBREVIATIONS[countryCode][date.getMonth()];
  return { dayLabel, dateLabel: `${day} ${month}` };
}

/** Format HH:MM from a Date in local time. */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Delivery window label for list/detail pages. */
export function formatDeliveryWindowText(
  windowStart: string | null,
  windowEnd: string | null,
  countryCode: CountryCode
): string {
  if (!windowStart || !windowEnd) return "—";
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  const dayLabel = getRelativeDayLabel(start, countryCode);
  return `${dayLabel} ${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Full date for history rows, e.g. "28 oktober 2024" / "28. Oktober 2024" /
 * "28 octobre 2024". Returns "" for an empty or unparseable timestamp.
 */
export function formatLongDate(isoTimestamp: string, countryCode: CountryCode): string {
  if (!isoTimestamp) return "";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = MONTH_NAMES[countryCode][date.getMonth()];
  const year = date.getFullYear();
  if (countryCode === "DE") return `${day}. ${month} ${year}`;
  return `${day} ${month} ${year}`;
}

/** Live ETA label, e.g. "Ankunft ca. 15:23". */
export function formatEtaText(etaMs: number | null, countryCode: CountryCode): string | null {
  if (etaMs === null || etaMs <= 0) return null;
  const eta = new Date(etaMs);
  const time = formatTime(eta);
  if (countryCode === "DE") return `Ankunft ca. ${time}`;
  if (countryCode === "FR") return `Arrivée vers ${time}`;
  return `Aankomst rond ${time}`;
}

/** Localized "today"/"tomorrow", or a localized day name. */
function getRelativeDayLabel(date: Date, countryCode: CountryCode): string {
  const today = new Date();
  const todayDate = toDateString(today);
  const tomorrowDate = toDateString(addDays(today, 1));
  const targetDate = toDateString(date);

  const labels = RELATIVE_LABELS[countryCode];
  if (targetDate === todayDate) return labels.today;
  if (targetDate === tomorrowDate) return labels.tomorrow;
  return DAY_NAMES[countryCode][date.getDay()];
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
