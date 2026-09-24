"use client";

import { ErrorView } from "@/components/ui/error-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCountryCode, useTranslations } from "@/contexts/country-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CountryCode } from "@/lib/core/types";
import {
  type GroceryReminderApiResponse,
  type GroceryReminderData,
  REMINDER_DAYS,
} from "@/lib/core/user-types";

const LOCALES: Record<CountryCode, string> = { NL: "nl-NL", DE: "de-DE", FR: "fr-FR" };

/**
 * The Boodschappenwekker, like the app's grocery reminder screen: the days
 * it rings (Monday first) and the time. Read-only for now, so there's no
 * "Opslaan" or "Wekker uitschakelen". The texts are ours, since this is a
 * native screen in the app.
 */
export default function ReminderPage() {
  const t = useTranslations();
  const { state, retry } = useApiResource<GroceryReminderApiResponse>(
    "/api/user/reminders",
    t.reminderLoadError
  );
  usePageTitle(t.accountReminders);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8 text-center">
        <h1 className="text-foreground text-3xl font-semibold">{t.accountReminders}</h1>
        <p className="text-foreground mt-6 text-lg">{t.reminderSubtitle}</p>

        {state.status === "loading" && <LoadingSpinner />}
        {state.status === "error" && <ErrorView message={state.message} onRetry={retry} />}
        {state.status === "success" && <Reminder reminder={state.data} />}
      </main>
    </div>
  );
}

function Reminder({ reminder }: { reminder: GroceryReminderData }) {
  const t = useTranslations();
  const countryCode = useCountryCode();
  const initials = [...t.reminderDayInitials];
  // 1 January 2024 was a Monday, so day i of the week is 1 + i January.
  const dayName = new Intl.DateTimeFormat(LOCALES[countryCode], {
    weekday: "long",
    timeZone: "UTC",
  });

  return (
    <>
      <ul className="mt-12 flex justify-center gap-3">
        {REMINDER_DAYS.map((day, index) => {
          const selected = reminder.days.includes(day);
          return (
            <li
              key={day}
              aria-label={dayName.format(new Date(Date.UTC(2024, 0, 1 + index)))}
              aria-current={selected || undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg ${selected ? "bg-picnic-red border-picnic-red text-white" : "border-gray-500 text-gray-600"}`}
            >
              {initials[index]}
            </li>
          );
        })}
      </ul>

      {reminder.days.length === 0 && (
        <p className="text-text-muted mt-6 text-sm">{t.reminderNotSet}</p>
      )}

      <p className="text-text-muted mt-10">{t.reminderTimeLabel}</p>
      <p className="text-foreground mx-auto mt-3 w-full max-w-60 rounded-full border-2 border-gray-500 py-3 text-xl">
        {reminder.time}
      </p>
    </>
  );
}
