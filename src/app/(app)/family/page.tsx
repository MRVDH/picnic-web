"use client";

import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";

/** The Mijn Family-account page, like the app's membership screen. */
export default function FamilyPage() {
  const t = useTranslations();
  const title = t.accountFamilyAccount.replace("{highlight}", t.accountFamilyAccountHighlight);
  usePageTitle(title);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
        <h1 className="text-foreground text-center text-2xl font-bold">{title}</h1>
      </main>
    </div>
  );
}
