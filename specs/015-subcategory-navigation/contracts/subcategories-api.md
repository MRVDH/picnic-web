# API Contract: Sub-category Navigation

**Feature**: 015-subcategory-navigation | **Date**: 2026-04-16
**New endpoint**: `GET /api/categories/[categoryId]/subcategories`

## Change Summary

1. **New API route**: `/api/categories/[categoryId]/subcategories` — fetches sub-categories for a given parent category.
2. **New type**: `SubcategoriesApiResponse` added to `src/lib/category-types.ts`.
3. **No existing endpoints modified**.

---

## Endpoint: GET /api/categories/[categoryId]/subcategories

Fetches the list of sub-categories for a given parent category ID.

**Upstream**: Calls `client.app.getPage("L1-category-page-root?category_id={categoryId}")` → `GET /pages/L1-category-page-root?category_id={categoryId}` (with Picnic headers)

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | `string` | Parent category ID (e.g., `"21724"`, `"CustomCatGlutenvrijL1"`) |

### Success Response (200)

**Content-Type**: `application/json`

```typescript
type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};

type CategoryItem = {
  id: string;
  name: string;
  imageId: string;
  deepLinkTarget: string;
};
```

**Example response** (for categoryId `21724` = "Fruit"):

```json
{
  "title": "Fruit",
  "subcategories": [
    {
      "id": "CustomCatNLFruitLvl2Pos1",
      "name": "Fruit van Hollandse bodem",
      "imageId": "68ffa1f0d80937c1b014088cc8bf301f5052ae729f3f2d4e125b9b7ad3a01dcc",
      "deepLinkTarget": "app.picnic://store/page;id=L2-category-page-root,category_id=CustomCatNLFruitLvl2Pos1"
    },
    {
      "id": "21746",
      "name": "Sinaasappel & citrus",
      "imageId": "b661a3b11ae2705c9591c45d81c107a72d34f585f619689e5ebff7f92e007353",
      "deepLinkTarget": "app.picnic://store/page;id=L2-category-page-root,category_id=21746"
    },
    {
      "id": "21745",
      "name": "Banaan, appel & peer",
      "imageId": "6698d7a5ab58aa766cfbea7f4f881821d7a35e3ca0ee83c23ec50a6aff52f25f",
      "deepLinkTarget": "app.picnic://store/page;id=L2-category-page-root,category_id=21745"
    }
  ]
}
```

*Full response contains ~8 sub-categories for "Fruit". Count varies by parent category.*

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{ "error": "Authentication required", "code": "TOKEN_EXPIRED" }` | Missing/expired auth token |
| 502 | `{ "error": "Kan subcategorieën niet laden. Probeer het later opnieuw." }` | Upstream API failure |

---

## Processing Pipeline

### GET /api/categories/[categoryId]/subcategories

```text
1. Read categoryId from URL path params
2. Read auth token from cookie
3. Build Picnic client
4. client.app.getPage("L1-category-page-root?category_id={categoryId}") → raw FusionPage
5. Extract title from FusionPage.header.title
6. parseSubcategoryPage(rawPage) → CategoryItem[]
   a. Find BlockComponent with id containing "L1-category-page-list" (or fallback to any block with category items)
   b. Extract children where type === "PML" and id starts with "core-list-item-category-"
   c. For each PMLItem: same extraction as top-level categories
      - id: strip "core-list-item-category-" prefix
      - name: read pml.component.accessibilityLabel
      - imageId: find IMAGE source.id in PML tree
      - deepLinkTarget: read pml.component.onPress.target
   d. Filter out items with missing name or imageId
   e. Skip the "core-category-promotions-item" (Acties link)
7. Return { title, subcategories: CategoryItem[] } as JSON
```

## Backward Compatibility

- **Additive only**: New endpoint and type, no existing endpoints or types modified.
- `GET /api/categories` continues to work unchanged.
- `CategoryItem` type is reused without modification.
