# API Contract: Product Detail

**Feature**: 005-product-detail-page  
**Date**: 2026-03-30

## `GET /api/product/[id]`

Fetches comprehensive product detail information for a single product by its selling unit ID.

### Request

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | URL path | `string` | Yes | The product selling unit ID (e.g. `s1001524`) |

**Authentication**: Requires `picnic_auth_token` HTTP-only cookie.

### Response: 200 OK

Returns the full product detail object.

```json
{
  "id": "s1001524",
  "name": "Blond",
  "brand": "Affligem",
  "unitQuantity": "6 x 300 ml",
  "unitPrice": "€4.81/l",
  "displayPrice": 865,
  "maxCount": 99,
  "imageIds": ["img-abc-123", "img-def-456", "img-ghi-789"],
  "description": "Goudblond abdijbier met een fruitige toets.",
  "highlights": ["Goudblond abdijbier", "Met hints van tropisch fruit"],
  "allergens": {
    "confirmed": ["Gluten", "Gerst"],
    "mayContain": ["Tarwe"]
  },
  "infoSections": [
    {
      "title": "Ingrediënten",
      "content": "Water, gerstemout, hop, gist."
    },
    {
      "title": "Voedingswaarde",
      "content": "| Per 100 ml | |\n|---|---|\n| Energie | 176 kJ / 42 kcal |\n| Vetten | 0 g |"
    },
    {
      "title": "Extra informatie",
      "content": "Bewaren: koel en droog."
    }
  ],
  "promotion": {
    "id": "promo-123",
    "label": "1+1 gratis"
  },
  "bundles": [
    {
      "id": "s1001524",
      "quantity": 1,
      "pricePerUnit": 865,
      "imageId": "img-abc-123",
      "maxCount": 99
    },
    {
      "id": "s1001525",
      "quantity": 2,
      "pricePerUnit": 750,
      "imageId": "img-abc-123",
      "maxCount": 50
    }
  ],
  "similarProducts": [
    {
      "id": "s2003456",
      "name": "Blond Bier",
      "imageId": "img-xyz-111",
      "displayPrice": 795,
      "unitQuantity": "6 x 330 ml",
      "maxCount": 99
    }
  ]
}
```

### Response: 401 Unauthorized

Returned when the auth token is missing, invalid, or expired.

```json
{
  "error": "Your token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### Response: 404 Not Found

Returned when the product ID does not exist or the Fusion page returns no data for it.

```json
{
  "error": "Product not found"
}
```

### Response: 502 Bad Gateway

Returned when the upstream Picnic API is unreachable or returns an unexpected error.

```json
{
  "error": "Failed to fetch product details. Please try again later."
}
```

### Field Reference

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Selling unit ID |
| `name` | `string` | No | Product name |
| `brand` | `string` | No | Brand name (empty string if unavailable) |
| `unitQuantity` | `string` | No | Weight/volume description |
| `unitPrice` | `string` | Yes | Price per unit (e.g. "€4.81/l") |
| `displayPrice` | `number` | No | Price in euro cents |
| `maxCount` | `number` | No | Maximum cart quantity |
| `imageIds` | `string[]` | No | Gallery image IDs (may be empty) |
| `description` | `string` | Yes | Product description (markdown) |
| `highlights` | `string[]` | No | Highlight phrases (may be empty) |
| `allergens` | `object` | No | `{ confirmed: string[], mayContain: string[] }` |
| `allergens.confirmed` | `string[]` | No | Confirmed allergens |
| `allergens.mayContain` | `string[]` | No | "Bevat mogelijk" allergens |
| `infoSections` | `array` | No | Accordion sections (may be empty) |
| `infoSections[].title` | `string` | No | Section title |
| `infoSections[].content` | `string` | No | Section content (markdown) |
| `promotion` | `object` | Yes | Active promotion |
| `promotion.id` | `string` | No | Promotion identifier |
| `promotion.label` | `string` | No | Display label |
| `bundles` | `array` | No | Bundle options (may be empty) |
| `bundles[].id` | `string` | No | Bundle selling unit ID |
| `bundles[].quantity` | `number` | No | Items in bundle |
| `bundles[].pricePerUnit` | `number` | No | Per-unit price in cents |
| `bundles[].imageId` | `string` | No | Bundle image ID |
| `bundles[].maxCount` | `number` | No | Max cart quantity |
| `similarProducts` | `array` | No | Similar products (may be empty) |
| `similarProducts[].id` | `string` | No | Selling unit ID |
| `similarProducts[].name` | `string` | No | Product name |
| `similarProducts[].imageId` | `string` | No | Image ID |
| `similarProducts[].displayPrice` | `number` | No | Price in cents |
| `similarProducts[].unitQuantity` | `string` | No | Weight/volume description |
| `similarProducts[].maxCount` | `number` | No | Max cart quantity |
| `similarProducts[].deposit` | `number` | Yes | Deposit in cents (if applicable) |
