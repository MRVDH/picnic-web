/**
 * Savings label for bundle discounts.
 *
 * Displays "€X.XX bespaard" above the quantity stepper when a bundle
 * threshold is met. Only renders when savingsInCents > 0.
 */

import { CENTS_DIVISOR } from "@/lib/types";

type SavingsLabelProps = {
  /** Total savings amount in cents. */
  savingsInCents: number;
};

export function SavingsLabel({ savingsInCents }: SavingsLabelProps) {
  if (savingsInCents <= 0) return null;

  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(savingsInCents / CENTS_DIVISOR);

  return (
    <span className="text-xs font-semibold text-picnic-red">
      {formatted} bespaard
    </span>
  );
}
