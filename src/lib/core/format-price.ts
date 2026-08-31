import { CENTS_DIVISOR } from "@/lib/core/types";

/**
 * Format a price in cents to a display string without currency symbol.
 * NL/DE/FR all use a comma as decimal separator (e.g. 149 → "1,49").
 */
export function formatPrice(cents: number): string {
  return (cents / CENTS_DIVISOR).toFixed(2).replace(".", ",");
}

/**
 * Format a price in cents to a European display string with € symbol.
 * Uses comma as decimal separator (e.g. 149 → "€1,49").
 */
export function formatEuroPrice(cents: number): string {
  return `€${(cents / CENTS_DIVISOR).toFixed(2).replace(".", ",")}`;
}
