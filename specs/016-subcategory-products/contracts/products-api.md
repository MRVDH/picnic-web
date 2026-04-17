# API Contract: Category Products

**Endpoint**: `GET /api/categories/{categoryId}/products`  
**Feature**: 016-subcategory-products

## Request

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `categoryId` | Path | `string` | Yes | The L2 sub-category ID |

## Response

### 200 OK

```json
{
  "title": "Brood",
  "products": [
    {
      "id": "s1001524",
      "name": "Volkoren tijgerbrood heel",
      "namePrefix": null,
      "subtitle": null,
      "brand": "Picnic",
      "highlight": null,
      "flagIconKey": null,
      "flagFallbackImageId": null,
      "imageId": "abc123",
      "displayPrice": 179,
      "originalPrice": null,
      "unitQuantity": "800 g",
      "maxCount": 50,
      "priceRanges": null,
      "badges": [],
      "isUnavailable": false,
      "unavailableReason": null
    }
  ]
}
```

### 401 Unauthorized (token expired)

```json
{
  "error": "Authentication token expired",
  "code": "TOKEN_EXPIRED"
}
```

### 502 Bad Gateway (upstream failure)

```json
{
  "error": "Failed to load category products"
}
```

## Implementation Notes

- Auth token is read from the `picnic_auth_token` HTTP-only cookie
- Upstream call: `client.app.getPage("L2-category-page-root?category_id={categoryId}")`
- Products are parsed from selling-unit tile PML nodes using `containerToProduct()`
- Products are deduplicated by ID (first occurrence wins)
- Page title is extracted from `rawPage.header.title`
