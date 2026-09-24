import { asArray, asNumber, isObject } from "@/lib/core/type-guards";
import { type GroceryReminderData, REMINDER_DAYS, type ReminderDay } from "@/lib/core/user-types";

/** The app's default when no reminder is set (GroceryReminder view model). */
const DEFAULT_TIME: [number, number] = [20, 0];

/**
 * Parse GET /reminders (picnic-api `customerService.getReminders`):
 * `{ reminders: [{ day_of_week: "TUESDAY", time_of_day: [20, 0] }] }`, or no
 * body (204) when the Boodschappenwekker is off. The app keeps one time for
 * all selected days, so the first reminder's time is used.
 */
export function parseReminders(rawData: unknown): GroceryReminderData {
  const reminders = isObject(rawData) ? asArray(rawData["reminders"]).filter(isObject) : [];

  const selected = new Set(reminders.map((reminder) => reminder["day_of_week"]));
  const days = REMINDER_DAYS.filter((day): day is ReminderDay => selected.has(day));

  const rawTime = reminders.map((reminder) => asArray(reminder["time_of_day"]))[0];
  const [hour, minute] =
    rawTime && rawTime.length >= 2 ? [asNumber(rawTime[0]), asNumber(rawTime[1])] : DEFAULT_TIME;

  return {
    days,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}
