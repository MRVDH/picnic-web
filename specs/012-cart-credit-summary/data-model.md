# Data Model: Cart Credit Settlement Display

**Feature**: 012-cart-credit-summary
**Date**: 2026-04-15

## Overview

This feature adds a single numeric field to the existing `CartData` type and renders it as a conditional line in the order summary. No new entities, state machines, or persistent storage are introduced.

## Type Changes

### `CartData` (in `src/lib/types.ts`)

Add one field to the existing type:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `creditSettlement` | `number` | `0` | Picnic credit (tegoed) applied to this order, in cents. `0` when no credit applied or field absent from API. |

Updated type definition:

```typescript
export type CartData = {
  items: CartItem[];
  totalPrice: number;          // checkout_total_price in cents
  totalCount: number;
  totalDiscount: number;       // calculated, in cents
  depositTotal: number;        // calculated, in cents
  depositBreakdown: DepositEntry[];
  membershipSavings: number;   // in cents
  creditSettlement: number;    // NEW: Picnic credit applied, in cents
  minimumOrderValue: number | null;
  suggestions: SliderProduct[];
};
```

### `OrderSummaryProps` (in `src/components/order-summary.tsx`)

Add one prop to the existing component props type:

| Prop | Type | Description |
|------|------|-------------|
| `creditSettlement` | `number` | Credit amount in cents. Row rendered when `> 0`. |

## Field Mapping

### Raw API → CartData

| Raw API field | CartData field | Extraction |
|--------------|----------------|------------|
| `<to be discovered>` (see research.md R1) | `creditSettlement` | `asNumber(rawData["<field_name>"])` — returns `0` if absent/non-numeric |

### CartData → OrderSummary

| CartData field | OrderSummary prop | Mapping |
|----------------|-------------------|---------|
| `creditSettlement` | `creditSettlement` | Direct pass-through from `cart.creditSettlement` |

## Display Rules

| Condition | Behavior |
|-----------|----------|
| `creditSettlement > 0` | Show row: label "Verrekening Picnic Tegoed", value `−{formatPrice(creditSettlement)}`, styled `text-picnic-green` |
| `creditSettlement === 0` | Hide row (no render) |
| Field absent from API | `asNumber` returns `0` → hide row |

## Existing Types Referenced

From `src/lib/types.ts` (unchanged):

- `CartItem` — individual cart line items (not affected)
- `DepositEntry` — deposit breakdown entries (not affected)
- `SliderProduct` — suggestion products (not affected)

## State Transitions

The credit settlement value has no independent lifecycle. It is:

1. Extracted from the raw API response during `parseCartResponse`
2. Returned as part of `CartData` JSON from `GET /api/cart`
3. Passed as a prop to `OrderSummary`
4. Re-extracted on every cart fetch (initial load, add/remove items)

```
Cart API fetch → parseCartResponse extracts creditSettlement → CartData returned
  → CartPage reads cart.creditSettlement → passes to OrderSummary
  → OrderSummary conditionally renders row
```

No cleanup, caching, or invalidation is needed — the value is always fresh from the API.
