import { formatPrice } from "@/lib/core/format-price";
import { CENTS_DIVISOR } from "@/lib/core/types";

type CartPriceProps = {
  /** Current price in cents. */
  displayPrice: number;
  /** Original price in cents (before discount), or null. */
  originalPrice: number | null;
};

/**
 * A basket price like the app's: euros with the cents raised (4²⁹). A
 * discounted price is red, next to the old price struck through in grey.
 */
export function CartPrice({ displayPrice, originalPrice }: CartPriceProps) {
  const hasDiscount = originalPrice !== null && originalPrice > displayPrice;

  return (
    <div className="flex items-start gap-2">
      {hasDiscount && (
        <SplitPrice cents={originalPrice} className="text-price-original text-lg line-through" />
      )}
      <SplitPrice
        cents={displayPrice}
        className={`text-2xl font-semibold ${hasDiscount ? "text-price-discount" : "text-price"}`}
      />
    </div>
  );
}

function SplitPrice({ cents, className }: { cents: number; className: string }) {
  const euros = Math.floor(cents / CENTS_DIVISOR);
  const rest = String(cents % CENTS_DIVISOR).padStart(2, "0");

  // Screen readers get the plain price; the split digits are for the eye only.
  return (
    <span className={`inline-flex items-start leading-none ${className}`}>
      <span className="sr-only">{formatPrice(cents)}</span>
      <span aria-hidden="true">{euros}</span>
      <span aria-hidden="true" className="ml-px text-[0.55em] leading-none">
        {rest}
      </span>
    </span>
  );
}
