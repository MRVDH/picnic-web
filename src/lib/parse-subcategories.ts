// Parser that extracts CategoryItem[] from an L1 category page
// FusionPage PML tree. Reuses shared extraction logic from parse-categories.

import { findNodeByIdSubstring } from "@/lib/pml-helpers";
import {
  CATEGORY_ITEM_PREFIX,
  extractCategoryFromPmlItem,
} from "@/lib/parse-categories";
import type { CategoryItem } from "@/lib/category-types";

const L1_CATEGORY_LIST_BLOCK_ID = "L1-category-page-list";

/**
 * Parse an L1 category FusionPage into CategoryItem[].
 *
 * The L1 page has the same PML item structure as the top-level
 * category list, but the container block ID differs.
 */
export function parseSubcategoryPage(rawPage: unknown): CategoryItem[] {
  const listBlock = findNodeByIdSubstring(rawPage, L1_CATEGORY_LIST_BLOCK_ID);
  if (!listBlock) return [];

  const children = listBlock.children;
  if (!Array.isArray(children)) return [];

  const subcategories: CategoryItem[] = [];
  for (const child of children) {
    if (typeof child !== "object" || child === null) continue;

    const record = child as Record<string, unknown>;
    if (record.type !== "PML") continue;

    const itemId = record.id;
    if (typeof itemId !== "string") continue;
    if (!itemId.startsWith(CATEGORY_ITEM_PREFIX)) continue;

    const category = extractCategoryFromPmlItem(record, itemId);
    if (category) subcategories.push(category);
  }

  return subcategories;
}

/**
 * Extract the page title from a FusionPage's header.
 * Returns null if the header or title is missing.
 */
export function extractPageTitle(rawPage: unknown): string | null {
  if (typeof rawPage !== "object" || rawPage === null) return null;
  const header = (rawPage as Record<string, unknown>).header;
  if (typeof header !== "object" || header === null) return null;
  const title = (header as Record<string, unknown>).title;
  return typeof title === "string" ? title : null;
}
