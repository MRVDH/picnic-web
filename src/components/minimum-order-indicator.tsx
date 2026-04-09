import { CENTS_DIVISOR } from "@/lib/types";

type MinimumOrderIndicatorProps = {
  currentTotal: number;
  minimumOrderValue: number | null;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / CENTS_DIVISOR);
}

/**
 * Shows a progress bar and remaining-amount text when the cart is below the
 * minimum order value for the selected delivery slot.
 * Returns null when no minimum order value is available (no slot selected or
 * data unavailable).
 */
export function MinimumOrderIndicator({
  currentTotal,
  minimumOrderValue,
}: MinimumOrderIndicatorProps) {
  if (minimumOrderValue === null || minimumOrderValue <= 0) return null;

  const remaining = minimumOrderValue - currentTotal;
  const progress = Math.min(currentTotal / minimumOrderValue, 1);
  const met = remaining <= 0;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      {met ? (
        <div className="flex items-center gap-2 text-sm text-picnic-green">
          <span className="text-base">&#10003;</span>
          <span>Je hebt de minimale bestelwaarde bereikt</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Nog{" "}
            <span className="font-semibold">{formatPrice(remaining)}</span> tot
            de minimale bestelwaarde
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-picnic-green transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
