import type { ProductPromotion, BundleOption } from "@/lib/types";
import { formatPrice } from "@/lib/format-price";

type ProductPriceSectionProps = {
  displayPrice: number;
  originalPrice: number | null;
  promotion: ProductPromotion | null;
  bundles: BundleOption[];
};

export function ProductPriceSection({
  displayPrice,
  originalPrice,
  promotion,
  bundles,
}: ProductPriceSectionProps) {
  const hasDiscount = originalPrice !== null && originalPrice > displayPrice;

  return (
    <div className="space-y-3">
      {/* Price and promotion */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold ${hasDiscount ? "text-price-discount" : "text-foreground"}`}
          >
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-base text-price-original line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        {promotion && (
          <span className="rounded bg-[#fbd92b] px-2 py-0.5 text-sm font-medium text-[#333333]">
            {promotion.label}
          </span>
        )}
      </div>

      {/* Bundle options */}
      {bundles.length > 1 && (
        <div className="rounded-lg border border-card-border p-3">
          <p className="mb-2 text-sm font-medium text-foreground">
            Meer kopen, minder betalen
          </p>
          <div className="space-y-1">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {bundle.quantity}x
                </span>
                <span className="font-medium text-foreground">
                  {formatPrice(bundle.pricePerUnit)} / stuk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
