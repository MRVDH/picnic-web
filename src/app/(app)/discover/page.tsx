"use client";

import { useTranslations } from "@/contexts/country-context";
import { usePageTitle } from "@/hooks/use-page-title";

/** The app's "Ontdek" home. Still to be built; / redirects to /search meanwhile. */
export default function DiscoverPage() {
  const t = useTranslations();
  usePageTitle(t.discoverTitle);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <h1 className="text-foreground mb-6 text-2xl font-bold">{t.discoverTitle}</h1>
        <p className="text-text-muted text-sm">TODO</p>
      </main>
    </div>
  );
}
