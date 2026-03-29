import type { Product, Badge, BadgeVariant, SearchSection } from "./types";
import type { PmlNode, SellingUnitTileContainer } from "./pml-helpers";
import {
  findSellingUnitContainers,
  collectMarkdowns,
  stripColorTags,
} from "./pml-helpers";
import {
  extractPromotionLabel,
  findTextStackChildren,
  extractTextStackInfo,
  extractUnavailabilityFromPml,
  extractOriginalPriceFromPml,
} from "./extract-tile-data";

/** Convert a selling-unit tile container into a Product. */
function containerToProduct(container: SellingUnitTileContainer): Product | null {
  const su = container.content?.sellingUnit;
  if (!su) return null;

  const pml = container.pml?.component
    ? (container.pml as PmlNode)
    : undefined;
  const contexts = container.analytics?.contexts;

  const promotionLabel = extractPromotionLabel(contexts);
  const stackChildren = findTextStackChildren(pml);
  const textInfo = extractTextStackInfo(stackChildren, su.name, su.unit_quantity);
  const { isUnavailable, reason } = extractUnavailabilityFromPml(pml);
  const originalPrice = extractOriginalPriceFromPml(stackChildren, su.display_price);

  const badges: Badge[] = [];
  if (promotionLabel) {
    badges.push({ text: promotionLabel, variant: "promo" as BadgeVariant });
  }
  if (textInfo.extraLabel) {
    badges.push(textInfo.extraLabel);
  }

  const hasDiscount = originalPrice !== null && originalPrice > su.display_price;

  return {
    id: su.id,
    name: textInfo.displayName ?? su.name,
    namePrefix: textInfo.namePrefix,
    subtitle: textInfo.subtitle,
    brand: textInfo.brand,
    highlight: textInfo.highlight,
    flagIconKey: textInfo.flagIconKey,
    flagFallbackImageId: textInfo.flagFallbackImageId,
    imageId: su.image_id,
    displayPrice: su.display_price,
    originalPrice: hasDiscount ? originalPrice : null,
    unitQuantity: su.unit_quantity,
    maxCount: su.max_count,
    badges,
    isUnavailable,
    unavailableReason: reason,
  };
}

// ─── Tree navigation helpers ─────────────────────────────────────────────────

type PmlRecord = Record<string, unknown>;

/** Recursively find the first node whose `id` contains the given substring. */
function findNodeById(obj: unknown, idSubstring: string): PmlRecord | null {
  if (typeof obj !== "object" || obj === null) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findNodeById(item, idSubstring);
      if (r) return r;
    }
    return null;
  }
  const record = obj as PmlRecord;
  if (typeof record.id === "string" && record.id.includes(idSubstring)) {
    return record;
  }
  for (const value of Object.values(record)) {
    const r = findNodeById(value, idSubstring);
    if (r) return r;
  }
  return null;
}

/** Extract the section title from a header-wrapper node's PML markdown. */
function extractSectionTitle(headerNode: PmlRecord): string {
  const markdowns = collectMarkdowns(headerNode);
  const cleaned = markdowns
    .map((md) => stripColorTags(md))
    .filter(Boolean);
  return cleaned.join(" / ");
}

/** Extract products from a set of wrapper nodes using tile containers. */
function extractProductsFromWrappers(
  wrappers: PmlRecord[],
  seenIds: Set<string>,
): Product[] {
  const products: Product[] = [];
  for (const wrapper of wrappers) {
    const containers = findSellingUnitContainers(wrapper);
    for (const container of containers) {
      const product = containerToProduct(container);
      if (!product || seenIds.has(product.id)) continue;
      seenIds.add(product.id);
      products.push(product);
    }
  }
  return products;
}

// ─── Public API ──────────────────────────────────────────────────────────────

const HEADER_PREFIX = "client-side-filtering-section-header-wrapper-";
const WRAPPER_PREFIX = "client-side-filtering-section-wrapper-";
const VISUAL_SECTIONS_ID = "structured-selling-unit-search-result-visual-sections";

/**
 * Parse a Fusion search page into sections with headers and a flat product list.
 *
 * Walks the PML tree to find section header blocks and their adjacent product
 * wrapper blocks. Handles the "Opnieuw bestellen" re-order section (a sibling
 * outside visual-sections) and duplicate section names (using full display text).
 * Deduplicates products across sections (first-occurrence wins).
 */
export function parseFusionSearchSections(
  rawPage: unknown,
): { sections: SearchSection[]; products: Product[] } {
  const seenIds = new Set<string>();
  const sections: SearchSection[] = [];

  // Find the structured-selling-unit-search-result container
  const resultNode = findNodeById(rawPage, "structured-selling-unit-search-result");
  if (!resultNode) {
    // Fallback: no section structure found, extract all products flat
    return fallbackFlatParse(rawPage);
  }

  const resultChildren = resultNode.children as PmlRecord[] | undefined;
  if (!resultChildren) return fallbackFlatParse(rawPage);

  // Step 1: Extract "Opnieuw bestellen" section (siblings before visual-sections)
  for (let i = 0; i < resultChildren.length; i++) {
    const child = resultChildren[i];
    const childId = (child.id as string) ?? "";

    if (childId.startsWith(HEADER_PREFIX)) {
      const sectionKey = childId.slice(HEADER_PREFIX.length);
      const title = extractSectionTitle(child);

      // Collect following wrapper nodes for this section
      const wrappers: PmlRecord[] = [];
      for (let j = i + 1; j < resultChildren.length; j++) {
        const nextId = (resultChildren[j].id as string) ?? "";
        if (!nextId.startsWith(WRAPPER_PREFIX + sectionKey)) break;
        wrappers.push(resultChildren[j]);
      }

      const products = extractProductsFromWrappers(wrappers, seenIds);
      if (products.length > 0) {
        sections.push({ title, products });
      }
    }

    // Step 2: Process the visual-sections container
    if (childId === VISUAL_SECTIONS_ID || childId.includes(VISUAL_SECTIONS_ID)) {
      const vsChildren = child.children as PmlRecord[] | undefined;
      if (vsChildren) {
        parseSectionsFromChildren(vsChildren, sections, seenIds);
      }
    }
  }

  // Build flat product list from all sections
  const products = sections.flatMap((s) => s.products);

  return { sections, products };
}

/** Parse interleaved header/wrapper children into sections. */
function parseSectionsFromChildren(
  children: PmlRecord[],
  sections: SearchSection[],
  seenIds: Set<string>,
): void {
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    const childId = (child.id as string) ?? "";

    if (childId.startsWith(HEADER_PREFIX)) {
      const sectionKey = childId.slice(HEADER_PREFIX.length);
      const title = extractSectionTitle(child);

      // Collect following wrapper nodes that belong to this section
      // Wrappers have IDs like: WRAPPER_PREFIX + sectionKey or sectionKey__N
      const wrappers: PmlRecord[] = [];
      let j = i + 1;
      while (j < children.length) {
        const nextId = (children[j].id as string) ?? "";
        if (!nextId.startsWith(WRAPPER_PREFIX + sectionKey)) break;
        wrappers.push(children[j]);
        j++;
      }

      const products = extractProductsFromWrappers(wrappers, seenIds);
      if (products.length > 0) {
        sections.push({ title, products });
      }

      i = j; // Skip past the wrappers we just consumed
    } else {
      i++;
    }
  }
}

/** Fallback: extract all products flat when no section structure is found. */
function fallbackFlatParse(
  rawPage: unknown,
): { sections: SearchSection[]; products: Product[] } {
  const containers = findSellingUnitContainers(rawPage);
  const productMap = new Map<string, Product>();

  for (const container of containers) {
    const product = containerToProduct(container);
    if (!product) continue;

    const existing = productMap.get(product.id);
    if (
      !existing ||
      product.badges.length > existing.badges.length ||
      product.namePrefix ||
      product.subtitle ||
      product.brand
    ) {
      productMap.set(product.id, product);
    }
  }

  const products = Array.from(productMap.values());
  return { sections: [], products };
}

/**
 * Legacy flat parser. Extracts all products without section grouping.
 * @deprecated Use parseFusionSearchSections instead.
 */
export function parseFusionSearchPage(rawPage: unknown): Product[] {
  return fallbackFlatParse(rawPage).products;
}
