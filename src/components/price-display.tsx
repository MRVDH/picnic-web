import { formatPrice } from "@/lib/format-price";

type PriceDisplayProps = {
  /** Current price in cents. */
  displayPrice: number;
  /** Original price in cents (before discount), or null. */
  originalPrice: number | null;
  /**
   * API-driven color for the current price. When set, it overrides the default
   * discount/regular color so the price matches the mobile app (e.g. green for
   * a member/family discount, red for a clearance markdown).
   */
  displayPriceColor?: string | null;
};

export function PriceDisplay({ displayPrice, originalPrice, displayPriceColor }: PriceDisplayProps) {
  const hasDiscount = originalPrice !== null;
  const priceColorClass = displayPriceColor
    ? ""
    : hasDiscount
      ? "text-price-discount"
      : "text-price";

  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-lg font-bold ${priceColorClass}`}
        style={displayPriceColor ? { color: displayPriceColor } : undefined}
      >
        {formatPrice(displayPrice)}
      </span>
      {hasDiscount && (
        <span className="text-price-original text-sm line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
