// Helpers that extract CategoryItem data from Fusion PML list items,
// used by the sub-category parser.
import type { CategoryItem } from "@/lib/category/category-types";
import { collectPropertyValues } from "@/lib/pml/pml-helpers";

export const CATEGORY_ITEM_PREFIX = "core-list-item-category-";

/**
 * Extract a CategoryItem from a single PML item node.
 */
export function extractCategoryFromPmlItem(
  item: Record<string, unknown>,
  itemId: string
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
