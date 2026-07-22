// Parser that extracts CategoryItem[] from an L1 category page
// FusionPage PML tree. Reuses shared extraction logic from parse-categories.
import type { CategoryItem } from "@/lib/category-types";
import { CATEGORY_ITEM_PREFIX, extractCategoryFromPmlItem } from "@/lib/parse-categories";
import { findNodeByIdSubstring } from "@/lib/pml-helpers";

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Extract the page title from a FusionPage's header.
 *
 * The header lives under `layout.header` on newer pages and directly under
 * `header` on older ones. Prefer the nested location, but fall back to the
 * top-level header when the nested one is missing or malformed.
 *
 * Returns null if neither location yields a header with a string title.
 */
export function extractPageTitle(rawPage: unknown): string | null {
  const page = asRecord(rawPage);
  if (!page) return null;

  const header = asRecord(asRecord(page.layout)?.header) ?? asRecord(page.header);
  if (!header) return null;

  const title = header.title;
  return typeof title === "string" ? title : null;
}
