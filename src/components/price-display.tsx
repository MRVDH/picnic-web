import { CENTS_DIVISOR } from "@/lib/types";

type PriceDisplayProps = {
  /** Current price in cents. */
  displayPrice: number;
  /** Original price in cents (before discount), or null. */
  originalPrice: number | null;
};

function formatPrice(cents: number): string {
  const euros = cents / CENTS_DIVISOR;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}

export function PriceDisplay({ displayPrice, originalPrice }: PriceDisplayProps) {
  const hasDiscount = originalPrice !== null;

  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-lg font-bold ${hasDiscount ? "text-price-discount" : "text-price"}`}
      >
        {formatPrice(displayPrice)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-price-original line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
