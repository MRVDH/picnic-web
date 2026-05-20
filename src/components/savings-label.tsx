"use client";

/**
 * Savings label for bundle discounts.
 *
 * Displays "€X.XX bespaard" / "€X.XX gespart" as a green badge when a bundle
 * threshold is met. Only renders when savingsInCents > 0.
 */
import { useTranslations } from "@/contexts/country-context";
import { formatPrice } from "@/lib/format-price";

type SavingsLabelProps = {
  /** Total savings amount in cents. */
  savingsInCents: number;
};

export function SavingsLabel({ savingsInCents }: SavingsLabelProps) {
  const t = useTranslations();

  if (savingsInCents <= 0) return null;

  const formatted = formatPrice(savingsInCents);

  return (
    <span className="bg-picnic-green rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
      {formatted} {t.savedSuffix}
    </span>
  );
}
