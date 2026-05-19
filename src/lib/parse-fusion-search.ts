import {
  extractOriginalPriceFromPml,
  extractPromotionLabel,
  extractTextStackInfo,
  extractUnavailabilityFromPml,
  findTextStackChildren,
} from "./extract-card-data";
import { parseContentPageSections } from "./parse-content-page";
import type { PmlNode, SellingUnitTileContainer } from "./pml-helpers";
import {
  collectMarkdowns,
  findNodeByIdSubstring,
  findSellingUnitContainers,
  stripColorTags,
} from "./pml-helpers";
import type { Badge, BadgeVariant, BundleThreshold, Product, SearchSection } from "./types";

/** Parse raw price_ranges into BundleThreshold[], or null if empty/absent. */
function parsePriceRangesFromRaw(raw: unknown[] | null): BundleThreshold[] | null {
  if (!raw || raw.length === 0) return null;
  const thresholds: BundleThreshold[] = [];
  for (const entry of raw) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "price" in entry &&
      typeof (entry as Record<string, unknown>).price === "number" &&
      "from_quantity" in entry &&
      typeof (entry as Record<string, unknown>).from_quantity === "number"
    ) {
      const e = entry as { price: number; from_quantity: number };
      thresholds.push({ quantity: e.from_quantity, pricePerUnit: e.price });
    }
  }
  if (thresholds.length === 0) return null;
  thresholds.sort((a, b) => a.quantity - b.quantity);
  return thresholds;
}

/** Convert a selling-unit tile container into a Product. */
export function containerToProduct(container: SellingUnitTileContainer): Product | null {
  const su = container.content?.sellingUnit;
  if (!su) return null;

  const pml = container.pml?.component ? (container.pml as PmlNode) : undefined;
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
    priceRanges: parsePriceRangesFromRaw(su.price_ranges),
    badges,
    isUnavailable,
    unavailableReason: reason,
  };
}

// ─── Tree navigation helpers ─────────────────────────────────────────────────

type PmlRecord = Record<string, unknown>;

/** Extract the section title from a header-wrapper node's PML markdown. */
function extractSectionTitle(headerNode: PmlRecord): string {
  const markdowns = collectMarkdowns(headerNode);
  const cleaned = markdowns.map((md) => stripColorTags(md)).filter(Boolean);
  return cleaned.join(" / ");
}

/** Extract products from a set of wrapper nodes using tile containers. */
function extractProductsFromWrappers(wrappers: PmlRecord[], seenIds: Set<string>): Product[] {
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
export function parseFusionSearchSections(rawPage: unknown): {
  sections: SearchSection[];
  products: Product[];
} {
  const seenIds = new Set<string>();
  const sections: SearchSection[] = [];

  // Find the structured-selling-unit-search-result container
  const resultNode = findNodeByIdSubstring(rawPage, "structured-selling-unit-search-result");
  if (!resultNode) {
    // Not a search page — try content page parsers (campaign, horizontal, flat)
    return parseContentPageSections(rawPage);
  }

  const resultChildren = resultNode.children as PmlRecord[] | undefined;
  if (!resultChildren) return parseContentPageSections(rawPage);

  // Step 1: Extract "Opnieuw bestellen" section (siblings before visual-sections)
  for (let i = 0; i < resultChildren.length; i++) {
    const child = resultChildren[i];
    const childId = (child.id as string) ?? "";

    if (childId.startsWith(HEADER_PREFIX)) {
      const sectionKey = childId.slice(HEADER_PREFIX.length);
      const title = extractSectionTitle(child);

      // Collect wrapper nodes for this section. Two known API layouts:
      // 1. Wrapper is a direct sibling: header → wrapper-SectionKey → ...
      // 2. Wrapper is nested in an intermediate container (e.g. vertical-rfy):
      //    header → vertical-rfy { wrapper-SectionKey } → visual-sections
      const wrappers: PmlRecord[] = [];
      for (let j = i + 1; j < resultChildren.length; j++) {
        const sibling = resultChildren[j];
        const nextId = (sibling.id as string) ?? "";
        if (nextId.startsWith(WRAPPER_PREFIX + sectionKey)) {
          // Layout 1: direct wrapper sibling
          wrappers.push(sibling);
        } else if (
          nextId.startsWith(HEADER_PREFIX) ||
          nextId === VISUAL_SECTIONS_ID ||
          nextId.includes(VISUAL_SECTIONS_ID)
        ) {
          break; // Reached another section or visual-sections — stop searching
        } else {
          // Layout 2: search inside intermediate container for nested wrapper
          const nested = findNodeByIdSubstring(sibling, WRAPPER_PREFIX + sectionKey);
          if (nested) wrappers.push(nested as PmlRecord);
        }
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
  seenIds: Set<string>
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

// ─── Category page parser ────────────────────────────────────────────────────

const CATEGORY_ARTICLES_PREFIX = "category-tree-page-articles-section";
const CATEGORY_SUB_HEADER_PREFIX = "vertical-article-tiles-sub-header-";

/**
 * Parse a page into sections with headers and a flat product list.
 *
 * Cascades through layout strategies:
 * 1. Category-tree layout (L2 category pages)
 * 2. Fusion search layout (search result pages)
 * 3. Content page layout (campaign, "Nieuw", theme pages)
 * 4. Flat product extraction (last resort)
 */
export function parseCategoryPageSections(rawPage: unknown): {
  sections: SearchSection[];
  products: Product[];
} {
  const articleSections = findAllByIdPrefix(rawPage, CATEGORY_ARTICLES_PREFIX);

  if (articleSections.length === 0) {
    return parseFusionSearchSections(rawPage);
  }

  const seenIds = new Set<string>();
  const sections: SearchSection[] = [];

  for (const section of articleSections) {
    const headerNodes = findAllByIdPrefix(section, CATEGORY_SUB_HEADER_PREFIX);
    let title = "";
    for (const h of headerNodes) {
      title = extractSectionTitle(h);
      if (title) break;
    }
    if (!title) continue;

    const products = extractProductsFromWrappers([section as PmlRecord], seenIds);
    if (products.length > 0) {
      sections.push({ title, products });
    }
  }

  const products = sections.flatMap((s) => s.products);
  return { sections, products };
}

/** Find all nodes whose `id` starts with the given prefix. */
function findAllByIdPrefix(obj: unknown, prefix: string, results: PmlRecord[] = []): PmlRecord[] {
  if (typeof obj !== "object" || obj === null) return results;

  if (Array.isArray(obj)) {
    for (const item of obj) findAllByIdPrefix(item, prefix, results);
    return results;
  }

  const record = obj as PmlRecord;
  if (typeof record.id === "string" && record.id.startsWith(prefix)) {
    results.push(record);
    return results;
  }

  for (const value of Object.values(record)) {
    findAllByIdPrefix(value, prefix, results);
  }
  return results;
}

/**
 * Legacy flat parser. Extracts all products without section grouping.
 * @deprecated Use parseFusionSearchSections instead.
 */
export function parseFusionSearchPage(rawPage: unknown): Product[] {
  return parseContentPageSections(rawPage).products;
}
