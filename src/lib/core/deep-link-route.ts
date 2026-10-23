import { parsePageIdFromDeepLink } from "@/lib/core/parse-deep-link";

/** Pages that list a category's subcategories: the app's, and the older Fusion one. */
const CATEGORY_PAGE_IDS = ["subcategory-page", "L1-category-page-root"];
const MEALS_PAGE_ID = "meals-page-root";
const PROMOTIONS_PAGE_ID = "promo-page-root";
const PROMOTION_GROUP_PAGE_ID = "promo-group-deep-dive";

/**
 * Map a Picnic deep link to a web route, or null when it can't be routed.
 *
 *   ...;id=subcategory-page,category_id=21724      → /categories/21724
 *   ...;id=L1-category-page-root,category_id=21724 → /categories/21724
 *   ...;id=meals-page-root,tab=cookbook             → /cookbook
 *   ...;id=promo-page-root                          → /promotions
 *   ...;id=promo-group-deep-dive,promo_group_id=X   → /promotions/X
 *   ...;id=fresh-market-wineshop                    → /pages?pageId=fresh-market-wineshop&title=<title>
 */
export function resolveDeepLinkRoute(deepLink: string, title: string): string | null {
  const pageId = parsePageIdFromDeepLink(deepLink);
  if (!pageId) return null;

  const [basePageId, query = ""] = pageId.split("?");
  const params = new URLSearchParams(query);

  if (CATEGORY_PAGE_IDS.includes(basePageId)) {
    const categoryId = params.get("category_id");
    return categoryId ? `/categories/${encodeURIComponent(categoryId)}` : null;
  }

  if (pageId.startsWith(MEALS_PAGE_ID)) return "/cookbook";

  if (basePageId === PROMOTIONS_PAGE_ID) return "/promotions";

  const promotionGroupId = params.get("promo_group_id");
  if (basePageId === PROMOTION_GROUP_PAGE_ID && promotionGroupId) {
    return `/promotions/${encodeURIComponent(promotionGroupId)}`;
  }

  return `/pages?${new URLSearchParams({ pageId, title }).toString()}`;
}
