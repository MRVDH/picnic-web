import { CENTS_DIVISOR } from "@/lib/types";

/**
 * Format a price in cents to a display string without currency symbol.
 * Uses dot as decimal separator (e.g. 149 → "1.49").
 */
export function formatPrice(cents: number): string {
  return (cents / CENTS_DIVISOR).toFixed(2);
}
