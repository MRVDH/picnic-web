# API Contract: Cart Page

**Feature**: 006-cart-page | **Date**: 2026-04-07

## Internal API Route: `GET /api/cart`

This is the internal Next.js API route that proxies the Picnic API cart endpoint. It follows the same `sendRequest` cast pattern as `/api/search` and `/api/product/[id]`.

### Request

```
GET /api/cart
```

**Headers**: Standard browser headers. Auth token is read from the `picnic_auth_token` HTTP-only cookie (not a request header).

**Query Parameters**: None.

### Success Response (200)

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
  minimumOrderValue: number | null; // in cents, or null
  suggestions: SliderProduct[];
};
```

**Example** (abbreviated):

```json
{
  "items": [
    {
      "id": "ol-123",
      "productId": "s1001524",
      "name": "Halfvolle melk",
      "unitQuantity": "1 l",
      "imageId": "abc123",
      "displayPrice": 119,
      "originalPrice": null,
      "quantity": 2,
      "badges": [
        { "text": "6 dagen vers", "variant": "freshness" }
      ],
      "isUnavailable": false,
      "unavailableExplanation": null,
      "replacements": []
    }
  ],
  "totalPrice": 2550,
  "totalCount": 5,
  "totalDiscount": 420,
  "depositTotal": 50,
  "depositBreakdown": [
    { "type": "BAG", "value": 25, "count": 2, "total": 50 }
  ],
  "membershipSavings": 100,
  "minimumOrderValue": 3500,
  "suggestions": [
    {
      "id": "s2003456",
      "name": "Boter ongezouten",
      "imageId": "def456",
      "displayPrice": 249,
      "unitQuantity": "250 g",
      "maxCount": 10
    }
  ]
}
```

### Error Response (401 — Auth Expired)

```json
{
  "error": "Your session has expired. Please log in again.",
  "code": "TOKEN_EXPIRED"
}
```

**Client behavior**: Redirect to `/login?expired=true`.

### Error Response (502 — Upstream Failure)

```json
{
  "error": "Kan winkelwagen niet ophalen. Probeer het later opnieuw."
}
```

**Client behavior**: Display error message with retry button.

### Processing Pipeline

```text
1. readAuthToken(request) → token or 401
2. buildPicnicClient(token)
3. Cast client to sendRequest interface (same pattern as search/product routes)
4. sendRequest("GET", "/cart", null, false) → unknown (raw cart JSON)
5. parseCartResponse(rawData: unknown) → CartApiResponse
   a. Validate raw response structure at runtime (type guards / optional chaining)
   b. Merge decorator_overrides into items
   c. Extract quantity from QUANTITY decorators
   d. Map decorators to badges
   e. Detect unavailability and extract replacements
   f. Calculate totalDiscount from line item price diffs
   g. Calculate depositTotal from deposit_breakdown
   h. Extract minimumOrderValue from selected delivery slot
   i. Parse basket_sections for suggestions
6. Return CartApiResponse as JSON
```

### `sendRequest` Cast Pattern

The API route uses the same cast pattern as `/api/search` and `/api/product/[id]`:

```typescript
const rawCart = await (
  client as unknown as {
    sendRequest: (
      method: string,
      path: string,
      body: null,
      includePicnicHeaders: boolean,
    ) => Promise<unknown>;
  }
).sendRequest("GET", "/cart", null, false);
```

**Note**: `includePicnicHeaders` is `false` because the cart endpoint returns structured JSON, not a Fusion page. This differs from the search and product routes which use `true` to fetch Fusion/PML pages.

### Error Handling

| Upstream Error | Detection | Response |
|---------------|-----------|----------|
| 401/403 from Picnic API | `isApiAuthError(error)` (shared from `src/lib/api-error.ts`) | 401 + `TOKEN_EXPIRED` code |
| Network/timeout | `catch` block fallthrough | 502 + Dutch error message |
| Unknown error | `catch` block fallthrough | 502 + Dutch error message |

## Page Route: `/cart`

**File**: `src/app/cart/page.tsx`

**Type**: Client component (`"use client"`)

**State Machine**:

```typescript
type CartPageState =
  | { status: "loading" }
  | { status: "success"; cart: CartApiResponse }
  | { status: "empty" }
  | { status: "error"; message: string };
```

**State Transitions**:

```text
Initial → loading (on mount)
loading → success (cart has items)
loading → empty (cart has 0 items)
loading → error (fetch failed)
error → loading (retry triggered)
```

**Data Flow**:

```text
useEffect(mount/retry) → fetch("/api/cart") → parse JSON
  → if TOKEN_EXPIRED: redirect to /login?expired=true
  → if error: setPageState({ status: "error", message })
  → if success and totalCount === 0: setPageState({ status: "empty" })
  → if success and totalCount > 0: setPageState({ status: "success", cart })
```

## Shared Header Component

**File**: `src/components/shared-header.tsx`

The shared header replaces per-page inline headers on all authenticated pages (search, product detail, cart). It includes the cart icon with price badge.

**Data Flow** (on non-cart pages):

```text
useEffect(mount) → fetch("/api/cart") → parse JSON
  → if success: extract checkout_total_price for badge display
  → if error or loading: show cart icon without badge (silent degradation)
```

**Cart Icon Badge**:
- Shows red badge with total cart price (from `checkout_total_price`, formatted in Dutch locale)
- Hidden when cart is empty (totalCount === 0)
- Hidden while loading or on fetch failure
- Clicking the icon navigates to `/cart`
