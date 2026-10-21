import { parsePageIdFromDeepLink } from "@/lib/core/parse-deep-link";

/** Pages that list a category's subcategories: the app's, and the older Fusion one. */
const CATEGORY_PAGE_IDS = ["subcategory-page", "L1-category-page-root"];
const MEALS_PAGE_ID = "meals-page-root";

/**
 * Map a Picnic deep link to a web route, or null when it can't be routed.
 *
 *   ...;id=subcategory-page,category_id=21724      → /categories/21724
 *   ...;id=L1-category-page-root,category_id=21724 → /categories/21724
 *   ...;id=meals-page-root,tab=cookbook             → /cookbook
 *   ...;id=promo-page-root                          → /pages?pageId=promo-page-root&title=<title>
 */
export function resolveDeepLinkRoute(deepLink: string, title: string): string | null {
  const pageId = parsePageIdFromDeepLink(deepLink);
  if (!pageId) return null;

  if (CATEGORY_PAGE_IDS.includes(pageId.split("?")[0])) {
    const categoryId = new URLSearchParams(pageId.split("?")[1] ?? "").get("category_id");
    return categoryId ? `/categories/${encodeURIComponent(categoryId)}` : null;
  }

  if (pageId.startsWith(MEALS_PAGE_ID)) return "/cookbook";

  return `/pages?${new URLSearchParams({ pageId, title }).toString()}`;
}
