/**
 * Quantity stepper overlay for product cards.
 *
 * Displays minus/count/plus controls in a rounded container that overlays
 * the bottom of the product image area. The plus button is disabled when
 * quantity reaches the product's maximum allowed count.
 *
 * When bundle progress data is provided, shows dot indicators below the
 * count and a savings label above the stepper.
 */

import type { BundleProgress } from "@/lib/types";
import { BundleDots } from "./bundle-dots";
import { SavingsLabel } from "./savings-label";

type QuantityStepperProps = {
  quantity: number;
  maxCount: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Bundle progress data. Null when no bundle data is available. */
  bundleProgress?: BundleProgress | null;
  /** Regular (non-discounted) price in cents, for savings calculation. */
  regularPrice?: number;
};

// ─── Bundle computation ───────────────────────────────────────────────────────

type BundleDisplay = {
  dotsTotal: number;
  dotsFilled: number;
  savingsInCents: number;
};

function computeBundleDisplay(
  bundleProgress: BundleProgress,
  regularPrice: number,
): BundleDisplay {
  const { thresholds, currentQuantity } = bundleProgress;

  if (thresholds.length === 0) {
    return { dotsTotal: 0, dotsFilled: 0, savingsInCents: 0 };
  }

  // Find the active threshold (highest tier where qty <= currentQuantity).
  const activeThreshold = thresholds
    .filter((t) => t.quantity <= currentQuantity)
    .at(-1) ?? null;

  // Find the next unmet threshold (first tier where qty > currentQuantity).
  const nextUnmetThreshold =
    thresholds.find((t) => t.quantity > currentQuantity) ?? null;

  let savingsInCents = 0;
  let dotsTotal: number;
  let dotsFilled: number;

  if (activeThreshold) {
    savingsInCents =
      (regularPrice - activeThreshold.pricePerUnit) * currentQuantity;
    dotsTotal = nextUnmetThreshold
      ? nextUnmetThreshold.quantity
      : activeThreshold.quantity;
    dotsFilled = Math.min(currentQuantity, dotsTotal);
  } else {
    dotsTotal = thresholds[0].quantity;
    dotsFilled = Math.min(currentQuantity, dotsTotal);
  }

  // Ensure savings is never negative (e.g. if data is inconsistent).
  if (savingsInCents < 0) {
    savingsInCents = 0;
  }

  return { dotsTotal, dotsFilled, savingsInCents };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuantityStepper({
  quantity,
  maxCount,
  onIncrement,
  onDecrement,
  bundleProgress,
  regularPrice,
}: QuantityStepperProps) {
  const isAtMax = quantity >= maxCount;

  const hasBundleData = bundleProgress && bundleProgress.thresholds.length > 0;
  const bundleDisplay = hasBundleData && regularPrice !== undefined
    ? computeBundleDisplay(bundleProgress, regularPrice)
    : null;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Savings label — above the stepper when a bundle threshold is met */}
      {bundleDisplay && bundleDisplay.savingsInCents > 0 && (
        <SavingsLabel savingsInCents={bundleDisplay.savingsInCents} />
      )}

      <div className="flex items-center gap-0 rounded-full border border-gray-200 bg-white">
        {/* Minus button */}
        <button
          type="button"
          onClick={onDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-picnic-red text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95"
          aria-label="Verwijder 1"
        >
          −
        </button>

        {/* Quantity count + optional bundle dots */}
        <div className="flex min-w-[1.75rem] flex-col items-center">
          <span className="text-center text-sm font-bold text-foreground">
            {quantity}
          </span>
          {bundleDisplay && bundleDisplay.dotsTotal > 0 && (
            <BundleDots
              totalDots={bundleDisplay.dotsTotal}
              filledDots={bundleDisplay.dotsFilled}
            />
          )}
        </div>

        {/* Plus button */}
        <button
          type="button"
          onClick={onIncrement}
          disabled={isAtMax}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
            isAtMax
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "bg-picnic-red text-white hover:bg-red-700 active:scale-95"
          }`}
          aria-label="Voeg 1 toe"
        >
          +
        </button>
      </div>
    </div>
  );
}
