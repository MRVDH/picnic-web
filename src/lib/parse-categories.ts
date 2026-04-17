// Parser that extracts CategoryItem[] from the empty-search-page-root
// FusionPage PML tree. Uses existing pml-helpers for tree traversal.

import {
  findNodeByIdSubstring,
  collectPropertyValues,
} from "@/lib/pml-helpers";
import type { CategoryItem } from "@/lib/category-types";

const CATEGORY_LIST_BLOCK_ID = "category-tree-wrapper-list";
export const CATEGORY_ITEM_PREFIX = "core-list-item-category-";

/**
 * Parse the raw empty-search-page-root FusionPage into CategoryItem[].
 *
 * Navigates the PML tree to the known category list block, then extracts
 * each PML item's name, image ID, and deep link target.
 */
export function parseCategoryPage(rawPage: unknown): CategoryItem[] {
  const listBlock = findNodeByIdSubstring(rawPage, CATEGORY_LIST_BLOCK_ID);
  if (!listBlock) return [];

  const children = listBlock.children;
  if (!Array.isArray(children)) return [];

  const categories: CategoryItem[] = [];
  for (const child of children) {
    if (typeof child !== "object" || child === null) continue;

    const record = child as Record<string, unknown>;
    if (record.type !== "PML") continue;

    const itemId = record.id;
    if (typeof itemId !== "string") continue;
    if (!itemId.startsWith(CATEGORY_ITEM_PREFIX)) continue;

    const category = extractCategoryFromPmlItem(record, itemId);
    if (category) categories.push(category);
  }

  return categories;
}

/**
 * Extract a CategoryItem from a single PML item node.
 * Shared between top-level and sub-category parsers.
 */
export function extractCategoryFromPmlItem(
  item: Record<string, unknown>,
  itemId: string,
): CategoryItem | null {
  const id = itemId.slice(CATEGORY_ITEM_PREFIX.length);
  if (!id) return null;

  // Navigate into pml.component (the TOUCHABLE)
  const pml = item.pml;
  if (typeof pml !== "object" || pml === null) return null;

  const component = (pml as Record<string, unknown>).component;
  if (typeof component !== "object" || component === null) return null;

  const componentRecord = component as Record<string, unknown>;

  // Name: prefer accessibilityLabel (clean string, no markdown)
  const name = componentRecord.accessibilityLabel;
  if (typeof name !== "string" || name === "") return null;

  // Deep link target: onPress.target
  const onPress = componentRecord.onPress;
  let deepLinkTarget = "";
  if (typeof onPress === "object" && onPress !== null) {
    const target = (onPress as Record<string, unknown>).target;
    if (typeof target === "string") {
      deepLinkTarget = target;
    }
  }

  // Image ID: find first IMAGE source.id in the component tree
  const imageId = findFirstImageId(componentRecord);
  if (!imageId) return null;

  return { id, name, imageId, deepLinkTarget };
}

/**
 * Recursively search the component tree for the first IMAGE source.id.
 * Uses collectPropertyValues to find all "source" properties, then
 * picks the first one with a string "id" field.
 */
function findFirstImageId(component: Record<string, unknown>): string | null {
  const sources = collectPropertyValues(component, "source");

  for (const source of sources) {
    if (typeof source !== "object" || source === null) continue;

    const sourceId = (source as Record<string, unknown>).id;
    if (typeof sourceId === "string" && sourceId !== "") {
      return sourceId;
    }
  }

  return null;
}
