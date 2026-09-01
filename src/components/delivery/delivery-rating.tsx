"use client";

import { useState } from "react";

import { useTranslations } from "@/contexts/country-context";

type DeliveryRatingProps = {
  onSubmit: (rating: number) => Promise<void>;
  disabled?: boolean;
};

export function DeliveryRating({ onSubmit, disabled = false }: DeliveryRatingProps) {
  const t = useTranslations();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (selected === null || submitting || disabled) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-card-border bg-card-bg rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-base font-semibold">{t.deliveriesRateTitle}</h2>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled || submitting}
            onClick={() => setSelected(value)}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
              selected === value
                ? "bg-picnic-red text-white"
                : "border-card-border border bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={selected === null || submitting || disabled}
        onClick={() => void handleSubmit()}
        className="bg-picnic-orange mt-4 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t.deliveriesRateSubmit}
      </button>
    </div>
  );
}
