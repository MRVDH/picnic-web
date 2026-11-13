import type { Translations } from "@/lib/core/i18n";
import { CENTS_DIVISOR } from "@/lib/core/types";
import type { ComparisonUnit } from "@/lib/core/types";

/**
 * Format a price in cents to a display string without currency symbol.
 * Uses dot as decimal separator (e.g. 149 → "1.49").
 */
export function formatPrice(cents: number): string {
  return (cents / CENTS_DIVISOR).toFixed(2);
}

/**
 * Format a price in cents to a European display string with € symbol.
 * Uses comma as decimal separator (e.g. 149 → "€1,49").
 */
export function formatEuroPrice(cents: number): string {
  return `€${(cents / CENTS_DIVISOR).toFixed(2).replace(".", ",")}`;
}

/**
 * Format a price per kg, litre or piece the way the app writes unit prices,
 * e.g. 1498 → "€14.98/kg" or 39 → "€0.39/stuk".
 */
export function formatComparisonPrice(
  cents: number,
  unit: ComparisonUnit,
  t: Pick<Translations, "perPieceUnit">
): string {
  return `€${formatPrice(cents)}/${unitLabel(unit, t)}`;
}

/** The unit word of a comparison price, as used in "per kg" or "per stuk". */
export function unitLabel(unit: ComparisonUnit, t: Pick<Translations, "perPieceUnit">): string {
  return unit === "piece" ? t.perPieceUnit : unit;
}
