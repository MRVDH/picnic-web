# Quickstart: Sub-category Navigation

**Feature**: 015-subcategory-navigation
**Date**: 2026-04-16

## What This Feature Does

Adds drill-down navigation to the category browsing experience. When a user taps a top-level category (e.g., "Fruit"), the view transitions to show that category's sub-categories (e.g., "Sinaasappel & citrus", "Banaan, appel & peer") in the same list-row layout. A back button and category title heading let the user navigate back. Tapping a leaf sub-category (L2) is a no-op — product listing is out of scope.

## Prerequisites

- Feature 014 (search categories) must be implemented — this feature builds on its types, parser, and components.
- The debug route at `src/app/api/debug-category/route.ts` was used during research. **Delete this file** before merging.

## Files to Create (in implementation order)

### 1. `src/lib/parse-subcategories.ts` — Sub-category parser

Reuses the same extraction logic as `parse-categories.ts` but targets the L1 page structure.

```ts
import { findNodeByIdSubstring, collectPropertyValues } from "@/lib/pml-helpers";
import type { CategoryItem } from "@/lib/category-types";

const L1_CATEGORY_LIST_BLOCK_ID = "L1-category-page-list";
const CATEGORY_ITEM_PREFIX = "core-list-item-category-";

/**
 * Parse an L1 category FusionPage into CategoryItem[].
 * The L1 page has the same PML item structure as the top-level category list.
 */
export function parseSubcategoryPage(rawPage: unknown): CategoryItem[] {
  const listBlock = findNodeByIdSubstring(rawPage, L1_CATEGORY_LIST_BLOCK_ID);
  if (!listBlock) return [];

  // Reuse same extraction logic as parse-categories.ts
  // ... (see parse-categories.ts for the pattern)
}
```

**Note**: Consider extracting the shared PML item extraction into a helper to avoid duplicating `extractCategoryFromPmlItem`.

### 2. `src/app/api/categories/[categoryId]/subcategories/route.ts` — API route

```ts
import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { parseSubcategoryPage } from "@/lib/parse-subcategories";
import { isApiAuthError } from "@/lib/api-error";
import type { SubcategoriesApiResponse } from "@/lib/category-types";
import type { ApiErrorResponse } from "@/lib/types";

const L1_PAGE_PREFIX = "L1-category-page-root?category_id=";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
): Promise<NextResponse<SubcategoriesApiResponse | ApiErrorResponse>> {
  const { categoryId } = await params;
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  try {
    const client = buildPicnicClient(token);
    const rawPage = await client.app.getPage(`${L1_PAGE_PREFIX}${categoryId}`);
    const title = extractPageTitle(rawPage) ?? categoryId;
    const subcategories = parseSubcategoryPage(rawPage);
    return NextResponse.json({ title, subcategories });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[/api/categories/${categoryId}/subcategories] Failed:`, message);
    return NextResponse.json(
      { error: "Kan subcategorieën niet laden. Probeer het later opnieuw." },
      { status: 502 },
    );
  }
}

function extractPageTitle(rawPage: unknown): string | null {
  if (typeof rawPage !== "object" || rawPage === null) return null;
  const header = (rawPage as Record<string, unknown>).header;
  if (typeof header !== "object" || header === null) return null;
  const title = (header as Record<string, unknown>).title;
  return typeof title === "string" ? title : null;
}
```

## Files to Modify

### `src/lib/category-types.ts` — Add SubcategoriesApiResponse

```ts
/** Response shape for GET /api/categories/[categoryId]/subcategories. */
export type SubcategoriesApiResponse = {
  title: string;
  subcategories: CategoryItem[];
};
```

### `src/components/category-grid.tsx` — Add onCategoryTap callback

The category grid needs to accept a callback for when a category is tapped, instead of being a no-op:

```tsx
type CategoryGridProps = {
  categories: CategoryItem[];
  onCategoryTap?: (category: CategoryItem) => void;  // NEW
};
```

### `src/app/page.tsx` — Add navigation state and sub-category view

Key changes:

1. **Add navigation state**:
```ts
type CategoryNavState =
  | { level: "top" }
  | { level: "l1"; categoryId: string; categoryName: string };

const [categoryNav, setCategoryNav] = useState<CategoryNavState>({ level: "top" });
```

2. **Add sub-categories fetch** (when `categoryNav.level === "l1"`):
```ts
const [subcategoriesState, setSubcategoriesState] = useState<SubcategoriesState>({ status: "idle" });

useEffect(() => {
  if (categoryNav.level !== "l1") return;
  setSubcategoriesState({ status: "loading" });
  fetch(`/api/categories/${categoryNav.categoryId}/subcategories`)
    .then(res => res.json())
    .then(data => { /* handle success/error */ })
    .catch(() => { /* handle network error */ });
}, [categoryNav]);
```

3. **Render sub-category view** when navigating:
```tsx
{categoryNav.level === "l1" && (
  <div>
    <button onClick={() => setCategoryNav({ level: "top" })}>← Terug</button>
    <h2>{categoryNav.categoryName}</h2>
    {/* Same CategoryGrid component, but with subcategories data */}
    <CategoryGrid categories={subcategories} />
  </div>
)}
```

## Files to Delete

### `src/app/api/debug-category/route.ts`

Temporary debug endpoint from research phase. Must be removed before merging.

## Verification

1. Run `npm run lint` — should pass with no errors
2. Run `npm run build` — should compile successfully
3. Manual checks:
   - Load home page → top-level categories appear
   - Tap "Fruit" → sub-categories appear (Sinaasappel & citrus, Banaan, etc.)
   - Category title "Fruit" shown as heading
   - Back button returns to top-level categories
   - Top-level categories are still visible (not re-fetched)
   - Tap a sub-category (L2 link) → no-op (no error)
   - Network error during fetch → error view with retry
   - Expired token → redirect to login
