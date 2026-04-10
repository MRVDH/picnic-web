/**
 * Savings label for bundle discounts.
 *
 * Displays "€X.XX bespaard" above the quantity stepper when a bundle
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
    <span className="text-xs font-semibold text-picnic-red">
      {formatted} bespaard
    </span>
  );
}
