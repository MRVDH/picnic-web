/**
 * Savings label for bundle discounts.
 *
 * Displays "€X.XX bespaard" as a green badge when a bundle
 * threshold is met. Only renders when savingsInCents > 0.
 */

import { formatPrice } from "@/lib/format-price";

type SavingsLabelProps = {
  /** Total savings amount in cents. */
  savingsInCents: number;
};

export function SavingsLabel({ savingsInCents }: SavingsLabelProps) {
  if (savingsInCents <= 0) return null;

  const formatted = formatPrice(savingsInCents);

  return (
    <span className="rounded-full bg-picnic-green px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
      {formatted} bespaard
    </span>
  );
}
