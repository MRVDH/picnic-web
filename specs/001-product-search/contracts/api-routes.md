# API Contracts: Product Search

**Feature**: `004-product-search`
**Date**: 2026-03-27

These contracts define the internal API routes exposed by the Next.js server
to the browser client. The browser never communicates directly with the
Picnic API.

## Route: Search Products

**Endpoint**: `GET /api/search?q={query}`

### Request

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `q` | query string | string | Yes | Search term (e.g., "tomaten") |

### Response (200 OK)

```json
{
  "products": [
    {
      "id": "s1001524",
      "name": "Roma Tomaten",
      "imageId": "abc123",
      "currentPrice": 199,
      "originalPrice": 249,
      "unitQuantity": "500 g",
      "basePrice": "€3.98/kg",
      "brand": "Picnic",
      "labels": [
        { "type": "promotion", "text": "10% korting" },
        { "type": "size", "text": "Klein" }
      ],
      "isAvailable": true,
      "unavailableReason": null,
      "maxCount": 50
    }
  ],
  "query": "tomaten"
}
```

### Response (400 Bad Request)

Returned when `q` parameter is missing or empty/whitespace.

```json
{
  "error": "Search query is required"
}
```

### Response (502 Bad Gateway)

Returned when the upstream Picnic API is unreachable or returns an error.

```json
{
  "error": "Unable to fetch search results. Please try again later."
}
```

---

## Route: Search Suggestions

**Endpoint**: `GET /api/suggestions?q={query}`

### Request

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `q` | query string | string | Yes | Partial search term (minimum 2 characters) |

### Response (200 OK)

```json
{
  "suggestions": [
    { "id": "sug_1", "text": "tomaten" },
    { "id": "sug_2", "text": "tomatensaus" },
    { "id": "sug_3", "text": "tomatenpuree" }
  ]
}
```

### Response (400 Bad Request)

Returned when `q` parameter is missing or fewer than 2 characters.

```json
{
  "error": "Query must be at least 2 characters"
}
```

### Response (502 Bad Gateway)

Returned when the upstream Picnic API is unreachable or returns an error.

```json
{
  "error": "Unable to fetch suggestions. Please try again later."
}
```

---

## Image URL Convention

Product images are not served through our API. The client constructs CDN
URLs directly:

```
https://storefront-prod.{countryCode}.picnicinternational.com/static/images/{imageId}/{size}.png
```

| Parameter | Values |
|-----------|--------|
| `countryCode` | `nl` or `de` (from environment config) |
| `imageId` | The `imageId` field from the Product entity |
| `size` | `tiny`, `small`, `medium` (default), `large`, `extra-large` |

The country code is provided to the client via a public environment
variable (`NEXT_PUBLIC_PICNIC_COUNTRY_CODE`).
