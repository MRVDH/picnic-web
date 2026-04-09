# Contract: Cart Mutation API

**Feature**: 007-plp-cart-actions | **Date**: 2026-04-09

## POST /api/cart

Adds or removes a product from the user's cart. Proxies to the Picnic API's `add_product` or `remove_product` endpoints and returns the full updated cart state.

### Request

```text
POST /api/cart
Content-Type: application/json
Cookie: picnic_auth_token=<token>
```

**Body**:

```json
{
  "productId": "s1013635",
  "action": "add",
  "count": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | `string` | Yes | Selling unit ID |
| `action` | `"add" \| "remove"` | Yes | Mutation type |
| `count` | `number` | Yes | Number of units (typically 1) |

### Response — Success (200)

Returns the full `CartData` (same shape as `GET /api/cart`):

```json
{
  "items": [
    {
      "id": "9355",
      "productId": "s1013635",
      "name": "Vioblock vegan ongezouten",
      "unitQuantity": "250 gram",
      "imageId": "d3d7d7d5f...",
      "displayPrice": 299,
      "originalPrice": null,
      "quantity": 1,
      "badges": [],
      "isUnavailable": false,
      "unavailableExplanation": null,
      "replacements": []
    }
  ],
  "totalPrice": 299,
  "totalCount": 1,
  "totalDiscount": 0,
  "depositTotal": 0,
  "depositBreakdown": [],
  "membershipSavings": 0,
  "minimumOrderValue": 3500,
  "suggestions": []
}
```

### Response — Auth Error (401)

```json
{
  "error": "Your token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### Response — Bad Request (400)

```json
{
  "error": "Missing required fields: productId, action, count"
}
```

### Response — Upstream Error (502)

```json
{
  "error": "Kan winkelwagen niet bijwerken. Probeer het opnieuw."
}
```

### Implementation Notes

- The route handler reads `action` to determine which Picnic API endpoint to call:
  - `"add"` → `sendRequest("POST", "/cart/add_product", { product_id, count })`
  - `"remove"` → `sendRequest("POST", "/cart/remove_product", { product_id, count })`
- Both Picnic endpoints return the full cart response, which is parsed by `parseCartResponse`.
- The `sendRequest` call uses `includePicnicHeaders = false` (cart endpoints are structured JSON, not Fusion pages).
- Auth token is read from the HTTP-only cookie via `readAuthToken(request)`.

## GET /api/cart (Existing — No Changes)

The existing `GET /api/cart` route remains unchanged. It returns `CartData` and is used for the initial cart fetch on page load.
