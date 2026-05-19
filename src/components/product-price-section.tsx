import { formatPrice } from "@/lib/format-price";
import type { BundleOption, ProductPromotion } from "@/lib/types";

type ProductPriceSectionProps = {
  displayPrice: number;
  originalPrice: number | null;
  promotion: ProductPromotion | null;
  bundles: BundleOption[];
  /** Current cart quantity for this product, used to highlight the active tier. */
  cartQuantity?: number;
  /** Max allowed quantity for this product. */
  maxCount?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  /** Set cart to an exact quantity (used by bundle tier clicks). */
  onSetQuantity?: (quantity: number) => void;
};

export function ProductPriceSection({
  displayPrice,
  originalPrice,
  promotion,
  bundles,
  cartQuantity = 0,
  maxCount = 99,
  onIncrement,
  onDecrement,
  onSetQuantity,
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
            <span className="text-price-original text-base line-through">
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

      {/* Bundle price tier grid */}
      {bundles.length > 0 && (
        <BundleTierGrid
          bundles={bundles}
          cartQuantity={cartQuantity}
          onSetQuantity={onSetQuantity}
        />
      )}

      {/* Cart quantity stepper */}
      {onIncrement && onDecrement && (
        <PdpStepper
          quantity={cartQuantity}
          maxCount={maxCount}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      )}
    </div>
  );
}

// ─── Bundle Tier Grid ─────────────────────────────────────────────────────────

type BundleTierGridProps = {
  bundles: BundleOption[];
  cartQuantity: number;
  onSetQuantity?: (quantity: number) => void;
};

function BundleTierGrid({ bundles, cartQuantity, onSetQuantity }: BundleTierGridProps) {
  const activeTierIndex = findActiveTierIndex(bundles, cartQuantity);

  return (
    <div className="flex flex-wrap gap-2">
      {bundles.map((bundle, index) => {
        const isActive = index === activeTierIndex;

        return (
          <button
            key={bundle.id || index}
            type="button"
            onClick={() => onSetQuantity?.(bundle.quantity)}
            className={`flex min-w-[70px] flex-1 cursor-pointer flex-col items-center rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-[#d6e6cd] ring-1 ring-[#b0cfb0]" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span className="text-xs text-gray-500">Vanaf {bundle.quantity}</span>
            <span
              className={`text-sm font-bold ${
                isActive ? "text-price-discount" : "text-foreground"
              }`}
            >
              {formatPrice(bundle.pricePerUnit)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Returns the index of the highest tier whose quantity <= cartQuantity, or -1 if none. */
function findActiveTierIndex(bundles: BundleOption[], cartQuantity: number): number {
  if (cartQuantity === 0) return -1;

  let activeIndex = -1;
  for (let i = 0; i < bundles.length; i++) {
    if (bundles[i].quantity <= cartQuantity) {
      activeIndex = i;
    }
  }
  return activeIndex;
}

// ─── PDP Cart Stepper ─────────────────────────────────────────────────────────

type PdpStepperProps = {
  quantity: number;
  maxCount: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

function PdpStepper({ quantity, maxCount, onIncrement, onDecrement }: PdpStepperProps) {
  if (quantity === 0) {
    return (
      <button
        onClick={onIncrement}
        className="border-card-border text-foreground w-full rounded-lg border bg-white py-3 text-center text-sm font-semibold transition-colors hover:bg-gray-50"
      >
        In mandje
      </button>
    );
  }

  return (
    <div className="border-card-border flex items-center rounded-lg border bg-white">
      <button
        onClick={onDecrement}
        className="text-foreground flex-none px-5 py-3 text-lg font-bold transition-colors hover:bg-gray-50"
      >
        &minus;
      </button>
      <span className="text-foreground flex-1 text-center text-sm font-semibold">
        {quantity} in mandje
      </span>
      <button
        onClick={onIncrement}
        disabled={quantity >= maxCount}
        className="text-foreground flex-none px-5 py-3 text-lg font-bold transition-colors hover:bg-gray-50 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
