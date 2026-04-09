# Data Model: PLP Cart Actions

**Feature**: 007-plp-cart-actions | **Date**: 2026-04-09

## New Display Types (Application-Level)

These types are added to `src/lib/types.ts` and represent the cart action state on the PLP. They complement the existing `CartData`, `CartItem`, `Product`, and `BundleOption` types.

### CartMutationRequest

The request body for adding or removing products from the cart.

| Field | Type | Description |
|-------|------|-------------|
| `productId` | `string` | Selling unit ID (e.g., "s1013635") |
| `action` | `"add" \| "remove"` | Whether to add or remove units |
| `count` | `number` | Number of units to add or remove (always 1 for stepper taps) |

### CartMutationResponse

The response from `POST /api/cart`, which returns the full updated cart state.

| Field | Type | Description |
|-------|------|-------------|
| Same as `CartData` | `CartData` | The full updated cart state after the mutation |

### BundleProgress

Bundle discount progress for a single product, derived from PDP bundle data or cart promo data.

| Field | Type | Description |
|-------|------|-------------|
| `productId` | `string` | The product this bundle applies to |
| `thresholds` | `BundleThreshold[]` | Ordered list of bundle tiers (ascending by quantity) |
| `currentQuantity` | `number` | Current quantity in cart |

### BundleThreshold

A single tier in a bundle pricing scheme.

| Field | Type | Description |
|-------|------|-------------|
| `quantity` | `number` | Number of units needed to unlock this tier |
| `pricePerUnit` | `number` | Price per unit in cents at this tier |

### CartContextState

The state held by the `CartContext` provider.

| Field | Type | Description |
|-------|------|-------------|
| `quantities` | `Map<string, number>` | Product ID → current quantity in cart |
| `totalPrice` | `number` | Total cart price in cents (for header badge) |
| `totalCount` | `number` | Total item count in cart |
| `bundleData` | `Map<string, BundleProgress>` | Product ID → bundle progress (empty until bundle data loads) |
| `isLoading` | `boolean` | Whether initial cart fetch is in progress |

### CartContextActions

Actions exposed by the `CartContext` via the `useCart` hook.

| Field | Type | Description |
|-------|------|-------------|
| `addProduct` | `(productId: string) => void` | Add 1 unit of a product (optimistic) |
| `removeProduct` | `(productId: string) => void` | Remove 1 unit of a product (optimistic) |
| `getQuantity` | `(productId: string) => number` | Get current quantity for a product (0 if not in cart) |
| `getBundleProgress` | `(productId: string) => BundleProgress \| null` | Get bundle progress for a product |

## Existing Types Reused (No Modification)

- **`CartData`** — Full cart state from `parseCartResponse`. Used to initialize and update cart context.
- **`CartItem`** — Individual cart line items. Used to build the `quantities` map.
- **`Product`** — Search result product. Already has `id`, `maxCount`, `isUnavailable`.
- **`BundleOption`** — PDP bundle tier. Used to derive `BundleThreshold` when PDP data is fetched.
- **`ApiErrorResponse`** — Error response shape for API route.

## Existing Types Modified

### Product (no changes needed)

The `Product` type already has all fields needed for cart actions: `id` (for cart lookup), `maxCount` (for plus button cap), `isUnavailable` (for hiding controls). No modifications needed.

## Entity Relationships

```text
CartContext
├── quantities: Map<productId, number>        (derived from CartData.items)
├── bundleData: Map<productId, BundleProgress> (derived from PDP bundle fetch)
│   └── thresholds: BundleThreshold[]
├── totalPrice: number                        (from CartData.totalPrice)
└── totalCount: number                        (from CartData.totalCount)

Product Card
├── Product                                   (from search results)
├── quantity: number                          (from CartContext.getQuantity)
└── bundleProgress: BundleProgress | null     (from CartContext.getBundleProgress)
    ├── QuantityStepper
    │   ├── BundleDots                        (if bundleProgress !== null)
    │   └── SavingsLabel                      (if threshold met)
    └── AddButton                             (if quantity === 0)
```

## Transformation Rules

### Cart Response → Quantities Map

```text
FOR EACH item IN cartData.items:
  quantities.set(item.productId, item.quantity)
```

### BundleOption[] → BundleThreshold[] (from PDP data)

```text
FOR EACH bundle IN pdpBundles:
  threshold = { quantity: bundle.quantity, pricePerUnit: bundle.pricePerUnit }
SORT thresholds BY quantity ASC
```

### Bundle Progress Calculation

```text
GIVEN thresholds = [{ qty: 2, price: 280 }, { qty: 4, price: 260 }]
AND currentQuantity = 3

nextUnmetThreshold = thresholds.FIND(t => t.quantity > currentQuantity)
  → { qty: 4, price: 260 }

activeThreshold = thresholds.FILTER(t => t.quantity <= currentQuantity).LAST
  → { qty: 2, price: 280 }

IF activeThreshold:
  savings = (regularPrice - activeThreshold.pricePerUnit) * currentQuantity
  dotsTotal = nextUnmetThreshold ? nextUnmetThreshold.quantity : activeThreshold.quantity
  dotsFilled = currentQuantity (capped at dotsTotal)
ELSE:
  savings = 0
  dotsTotal = thresholds[0].quantity
  dotsFilled = currentQuantity (capped at dotsTotal)
```

### Optimistic Update Flow

```text
ON TAP plus:
  1. optimisticQuantity = currentQuantity + 1
  2. UPDATE quantities map immediately
  3. ENQUEUE mutation { productId, action: "add", count: 1 }

ON SERVER RESPONSE (success):
  4. UPDATE quantities map from response (reconcile)
  5. UPDATE totalPrice and totalCount from response

ON SERVER RESPONSE (failure):
  6. ROLLBACK quantities map to last confirmed state
  7. SHOW toast: "Er ging iets mis. Probeer het opnieuw."
```

## Validation Rules

| Rule | Description | Source |
|------|-------------|--------|
| Quantity capped at `product.maxCount` | Plus button disabled at max | FR-008 |
| Quantity minimum is 0 | Minus at qty 1 removes product | FR-007 |
| Unavailable products skip cart controls | No add button shown | FR-001, Edge case |
| Bundle thresholds must be sorted ascending | UI assumes ordered tiers | Implementation |
| All prices in cents (integers) | No floating-point arithmetic | Constitution III |
| Empty bundle data shows plain stepper | Graceful degradation | FR-017 |
