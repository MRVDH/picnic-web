"use client";

import { useTranslations } from "@/contexts/country-context";

type ErrorViewProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">:(</div>
      <p className="text-lg text-gray-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="bg-picnic-red mt-4 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          {t.retryButton}
        </button>
      )}
    </div>
  );
}
