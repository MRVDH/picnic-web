"use client";

import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslations } from "@/contexts/country-context";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  usePageTitle();
  const t = useTranslations();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-8 text-center">
      <h2 className="text-foreground text-2xl font-bold">{t.errorHeading}</h2>
      <p className="mt-2 text-gray-500">{error.message || t.errorUnexpected}</p>
      <button
        onClick={reset}
        className="bg-picnic-red hover:bg-picnic-red-dark mt-6 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-colors"
      >
        {t.errorRetry}
      </button>
    </div>
  );
}
