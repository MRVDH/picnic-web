"use client";

import { SharedHeader } from "@/components/layout/shared-header";
import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";

/** The app's "Favorieten" tab. Empty until Picnic's favorites data is wired up. */
export default function FavoritesPage() {
  const t = useTranslations();
  usePageTitle(t.favoritesTitle);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SharedHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-2xl font-bold">{t.favoritesTitle}</h1>
        <p className="text-text-muted text-sm">{t.favoritesEmpty}</p>
      </main>
    </div>
  );
}
