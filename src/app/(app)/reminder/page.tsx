"use client";

import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";

/**
 * The Boodschappenwekker. Picnic stores reminders per device (GET/PUT
 * /reminders are scoped to the x-picnic-did header), and the reminder is a
 * push notification on that device. The web can neither see the reminder set
 * on the user's phone nor deliver one, so this page only explains that it's
 * set in the app.
 */
export default function ReminderPage() {
  const t = useTranslations();
  usePageTitle(t.accountReminders);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8 text-center">
        <h1 className="text-foreground text-3xl font-semibold">{t.accountReminders}</h1>
        <p className="text-foreground mt-6 text-lg">{t.reminderSubtitle}</p>
        <p className="text-text-muted mt-8 rounded-xl bg-[#f8f5f2] px-5 py-4">
          {t.reminderPerDevice}
        </p>
      </main>
    </div>
  );
}
