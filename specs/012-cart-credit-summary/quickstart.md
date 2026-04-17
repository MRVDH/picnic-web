# Quickstart: Cart Credit Settlement Display

**Feature**: 012-cart-credit-summary
**Date**: 2026-04-15

## What This Feature Does

Displays the Picnic credit settlement ("Verrekening Picnic Tegoed") as a green deduction line in the cart order summary, giving users visibility into how much of their Picnic credit balance is being applied to the current order.

## Prerequisites

Before implementing, discover the exact raw API field name by temporarily logging the raw cart response:

```ts
// In src/lib/parse-cart.ts, inside parseCartResponse, after the isObject check:
console.log("Raw cart keys:", Object.keys(rawData));
console.log("Raw cart fees:", rawData["fees"]);
```

Run the app, load the cart page with a credit-bearing account, and check the server console. Remove the logging after discovery.

## Files to Modify

### `src/lib/types.ts`

Add `creditSettlement` to the `CartData` type:

```ts
export type CartData = {
  items: CartItem[];
  totalPrice: number;
  totalCount: number;
  totalDiscount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
  creditSettlement: number;    // NEW: Picnic credit applied, in cents
  minimumOrderValue: number | null;
  suggestions: SliderProduct[];
};
```

### `src/lib/parse-cart.ts`

Extract the credit settlement value in `parseCartResponse`, after the `membershipSavings` extraction (line ~386):

```ts
// Scenario A: top-level scalar field (most likely)
const creditSettlement = asNumber(rawData["<discovered_field_name>"]);

// Scenario B: entry in fees array (if field is inside fees)
// const fees = asArray(rawData["fees"]).filter(isObject);
// const creditFee = fees.find((f) => asString(f["type"]) === "<discovered_type>");
// const creditSettlement = creditFee ? asNumber(creditFee["amount"]) : 0;
```

Add `creditSettlement` to the return object and `emptyCartData()`.

### `src/components/order-summary.tsx`

Add `creditSettlement` to `OrderSummaryProps`:

```ts
type OrderSummaryProps = {
  totalPrice: number;
  totalCount: number;
  totalDiscount: number;
  depositTotal: number;
  depositBreakdown: DepositEntry[];
  membershipSavings: number;
  creditSettlement: number;    // NEW
  minimumOrderValue: number | null;
};
```

Add the credit settlement row after the membership savings row (after line ~78), before the minimum order value row:

```tsx
{/* Credit settlement row */}
{creditSettlement > 0 && (
  <div className="flex justify-between text-picnic-green">
    <span>Verrekening Picnic Tegoed</span>
    <span>−{formatPrice(creditSettlement)}</span>
  </div>
)}
```

### `src/app/cart/page.tsx`

Pass `creditSettlement` to the `OrderSummary` component (around line ~304-312):

```tsx
<OrderSummary
  totalPrice={cart.totalPrice}
  totalCount={cart.totalCount}
  totalDiscount={cart.totalDiscount}
  depositTotal={cart.depositTotal}
  depositBreakdown={cart.depositBreakdown}
  membershipSavings={cart.membershipSavings}
  creditSettlement={cart.creditSettlement}    // NEW
  minimumOrderValue={cart.minimumOrderValue}
/>
```

## Verification

1. Run `npm run lint` — should pass with no errors
2. Run `npm run build` — should compile successfully
3. Manual check with credit account:
   - Log in with an account that has Picnic credit
   - Add items to cart
   - View cart page → "Verrekening Picnic Tegoed" row should appear in green with minus prefix
   - Row should appear after "Picnic-lidmaatschapsbesparing" and before "Totaal"
4. Manual check without credit account:
   - Log in with an account that has no Picnic credit
   - View cart page → no credit settlement row should appear
5. Cart modification:
   - Add/remove items while on cart page
   - Credit settlement amount should update to reflect new API response
