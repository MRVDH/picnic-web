# Data Model: Cart Page Product Actions

**Feature**: 008-cart-page-actions | **Date**: 2026-04-09

## Type Changes

### 1. CartItem — Add `maxCount` field

**File**: `src/lib/types.ts`
**Location**: `CartItem` type (line ~276-301)

```typescript
// BEFORE
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitQuantity: string;
  imageId: string;
  displayPrice: number;
  originalPrice: number | null;
  quantity: number;
  badges: Badge[];
  isUnavailable: boolean;
  unavailableExplanation: string | null;
  replacements: SliderProduct[];
};

// AFTER (1 field added)
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitQuantity: string;
  imageId: string;
  displayPrice: number;
  originalPrice: number | null;
  quantity: number;
  /** Maximum allowed quantity for this product (from API max_count). */
  maxCount: number;
  badges: Badge[];
  isUnavailable: boolean;
  unavailableExplanation: string | null;
  replacements: SliderProduct[];
};
```

**Rationale**: The `QuantityStepper` requires `maxCount` to disable the plus button at the limit. The `Product` type already has `maxCount`; `CartItem` needs parity. The value comes from `firstArticle["max_count"]` in the raw cart API response.

**Impact**: Non-breaking. CartItem is only consumed by `CartItemCard` and the cart page — neither currently accesses `maxCount`. Adding the field does not break any existing code.

### 2. CartItemCard Props — Add callbacks

**File**: `src/components/cart-item.tsx`
**Current**: `CartItemCardProps = { item: CartItem }`

```typescript
// AFTER
type CartItemCardProps = {
  item: CartItem;
  /** Callback to increment this item's quantity. Null for unavailable items. */
  onIncrement?: () => void;
  /** Callback to decrement this item's quantity. Null for unavailable items. */
  onDecrement?: () => void;
};
```

**Rationale**: Dependency injection — the cart item card should not know how mutations work. It receives callbacks from the parent (cart page) which owns the mutation logic.

### 3. Parse-Cart — Extract maxCount

**File**: `src/lib/parse-cart.ts`
**Location**: `mapOrderLineToCartItem` function (lines 310-372)

```typescript
// BEFORE (return statement, line 358-371)
return {
  id: lineId,
  productId,
  name,
  unitQuantity,
  imageId,
  displayPrice,
  originalPrice,
  quantity,
  badges,
  isUnavailable: unavailable.isUnavailable,
  unavailableExplanation: unavailable.unavailableExplanation,
  replacements: unavailable.replacements,
};

// AFTER (maxCount added)
return {
  id: lineId,
  productId,
  name,
  unitQuantity,
  imageId,
  displayPrice,
  originalPrice,
  quantity,
  maxCount: firstArticle ? asNumber(firstArticle["max_count"], 99) : 99,
  badges,
  isUnavailable: unavailable.isUnavailable,
  unavailableExplanation: unavailable.unavailableExplanation,
  replacements: unavailable.replacements,
};
```

**Rationale**: The fallback of 99 matches the convention in `mapRawToSliderProduct` (line 231). If the API doesn't provide `max_count`, a generous default allows adding without artificial limits.

## No New Types Required

All existing types (`CartData`, `CartMutationRequest`, `CartApiResponse`) are sufficient. The cart page's state management uses `CartData` directly — no additional wrapper types needed.

## Entity Relationship

```
CartPage (state: CartData)
  ├── CartItemCard[] (props: CartItem + callbacks)
  │   └── QuantityStepper (props: quantity, maxCount, onIncrement, onDecrement)
  ├── OrderSummary (props: totalPrice, totalCount, ...)
  ├── MinimumOrderIndicator (props: currentTotal, minimumOrderValue)
  ├── CheckoutCta (no props)
  ├── ProductSlider (props: suggestions)
  └── CartToast (props: message, visible, onDismiss)
```

Data flows **down** via props. Mutation callbacks flow **up** via CartItemCard → CartPage → mutation queue → API → reconcile state → re-render all children.
