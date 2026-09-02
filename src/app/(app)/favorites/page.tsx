"use client";

import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";

/** The app's "Favorieten" tab. Still to be built; picnic-api has no favorites call yet. */
export default function FavoritesPage() {
  const t = useTranslations();
  usePageTitle(t.favoritesTitle);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-2xl font-bold">{t.favoritesTitle}</h1>
        <p className="text-text-muted text-sm">TODO</p>
      </main>
    </div>
  );
}
