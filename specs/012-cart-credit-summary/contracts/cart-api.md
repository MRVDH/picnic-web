# API Contract: Cart Credit Settlement

**Feature**: 012-cart-credit-summary | **Date**: 2026-04-15
**Extends**: `specs/006-cart-page/contracts/cart-api.md`

## Change Summary

The internal `GET /api/cart` response (`CartData`) gains one new field: `creditSettlement`. This is a non-breaking additive change — existing consumers ignore unknown fields.

## Updated Success Response (200)

**Content-Type**: `application/json`

```typescript
type CartApiResponse = {
  items: CartItem[];
  totalPrice: number;          // checkout_total_price in cents
  totalCount: number;
  totalDiscount: number;       // calculated, in cents
  depositTotal: number;        // calculated, in cents
  depositBreakdown: DepositEntry[];
  membershipSavings: number;   // in cents
  creditSettlement: number;    // NEW: Picnic credit applied, in cents (0 if none)
  minimumOrderValue: number | null;
  suggestions: SliderProduct[];
};
```

**New field details**:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `creditSettlement` | `number` | `>= 0` | Amount of Picnic credit (tegoed) applied to this order, in cents. `0` when no credit is applied or when the upstream API does not return the field. |

**Example** (with credit applied):

```json
{
  "items": [...],
  "totalPrice": 2550,
  "totalCount": 5,
  "totalDiscount": 420,
  "depositTotal": 50,
  "depositBreakdown": [
    { "type": "BAG", "value": 25, "count": 2, "total": 50 }
  ],
  "membershipSavings": 100,
  "creditSettlement": 500,
  "minimumOrderValue": 3500,
  "suggestions": [...]
}
```

**Example** (no credit):

```json
{
  "creditSettlement": 0
}
```

## Upstream Dependency

The `creditSettlement` value is extracted from the raw Picnic API `GET /cart` response. The exact upstream field name is to be discovered during implementation (see `research.md` R1). The `picnic-api` library (v4.1.0) does not type this field, but `sendRequest` returns raw unfiltered JSON.

**Candidate upstream fields**:

| Candidate | Shape | Extraction |
|-----------|-------|------------|
| Top-level scalar (e.g., `verrekening_picnic_tegoed`) | `number` (cents) | `asNumber(rawData["<field>"])` |
| Entry in `fees` array | `{ type: string, amount: number, label?: string }` | Filter by type, extract amount |

**Fallback behavior**: If neither candidate is present, `creditSettlement` defaults to `0` and the UI row is not rendered. No error is thrown.

## Processing Pipeline Update

Step 5 of the existing cart processing pipeline (from `specs/006-cart-page/contracts/cart-api.md`) gains a new sub-step:

```text
5. parseCartResponse(rawData: unknown) → CartApiResponse
   a. Validate raw response structure at runtime
   b. Merge decorator_overrides into items
   c. Extract quantity from QUANTITY decorators
   d. Map decorators to badges
   e. Detect unavailability and extract replacements
   f. Calculate totalDiscount from line item price diffs
   g. Calculate depositTotal from deposit_breakdown
   h. Extract minimumOrderValue from selected delivery slot
   i. Parse basket_sections for suggestions
   j. Extract creditSettlement from raw response    ← NEW
6. Return CartApiResponse as JSON
```

## Backward Compatibility

- **Additive only**: The new `creditSettlement` field is added to the response. No existing fields are removed or renamed.
- **Default `0`**: Consumers that do not read `creditSettlement` are unaffected. The value `0` is a safe default that triggers no UI changes.
- **No new endpoints**: This feature uses the existing `GET /api/cart` endpoint.
