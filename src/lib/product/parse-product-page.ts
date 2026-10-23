// Reads Picnic's Fusion pages that list product tiles, such as theme pages and shop pages
// (`fresh-market-wineshop`). Pages served as RSC go through the RSC renderer instead, and the
// promotions page goes through picnic-api's catalog.getPromotions.
import type { Badge, BundleThreshold, Product, SearchSection } from "@/lib/core/types";
import type { PmlNode, SellingUnitTileContainer } from "@/lib/pml/pml-helpers";
import {
  collectMarkdowns,
  findNodeByIdPrefix,
  findSellingUnitContainers,
  stripColorTags,
} from "@/lib/pml/pml-helpers";
import {
  extractDisplayPriceColor,
  extractOriginalPriceFromPml,
  extractPromotionBadge,
  extractTextStackInfo,
  extractUnavailabilityFromPml,
  findTextStackChildren,
} from "@/lib/product/extract-card-data";

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

  const stackChildren = findTextStackChildren(pml);
  const promotion = extractPromotionBadge(contexts, pml, stackChildren);
  const textInfo = extractTextStackInfo(stackChildren, su.name, su.unit_quantity);
  const { isUnavailable, reason } = extractUnavailabilityFromPml(pml);
  const originalPrice = extractOriginalPriceFromPml(stackChildren, su.display_price);

  // The promotion pill is rendered specially (inline by the price or on the
  // image); other labels (size, etc.) go in the generic badge row.
  const badges: Badge[] = [];
  if (textInfo.extraLabel) {
    badges.push(textInfo.extraLabel);
  }

  const hasDiscount = originalPrice !== null && originalPrice > su.display_price;

  return {
    id: su.id,
    name: textInfo.displayName ?? su.name,
    namePrefix: textInfo.namePrefix,
    subtitle: textInfo.subtitle,
    subtitleColor: textInfo.subtitleColor,
    subtitleLeadingIcon: textInfo.subtitleLeadingIcon,
    subtitleTrailingIcon: textInfo.subtitleTrailingIcon,
    brand: textInfo.brand,
    highlight: textInfo.highlight,
    flagIconKey: textInfo.flagIconKey,
    flagFallbackImageId: textInfo.flagFallbackImageId,
    imageId: su.image_id,
    displayPrice: su.display_price,
    originalPrice: hasDiscount ? originalPrice : null,
    displayPriceColor: extractDisplayPriceColor(stackChildren, su.display_price),
    unitQuantity: su.unit_quantity,
    maxCount: su.max_count,
    priceRanges: parsePriceRangesFromRaw(su.price_ranges),
    badges,
    promoBadge: promotion?.badge ?? null,
    promoPlacement: promotion?.placement ?? null,
    isUnavailable,
    unavailableReason: reason,
  };
}

type PmlRecord = Record<string, unknown>;

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Extract the section title from a header node's PML markdown. */
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

// ─── Horizontal selling-unit section parser ──────────────────────────────────

const HORIZONTAL_SECTION_PREFIX = "core-horizontal-selling-unit-section-localized";
const SUB_HEADER_PML_PREFIX = "horizontal-selling-unit-tiles-sub-header-pml";

/**
 * Parse pages using `core-horizontal-selling-unit-section-localized`
 * containers (e.g. "Nieuw", theme pages). Each section may contain a
 * `horizontal-selling-unit-tiles-sub-header-pml` node with the title.
 */
function parseHorizontalSellingSections(rawPage: unknown): {
  sections: SearchSection[];
  products: Product[];
} {
  const hSections = findAllByIdPrefix(rawPage, HORIZONTAL_SECTION_PREFIX);

  if (hSections.length === 0) {
    return fallbackFlatParse(rawPage);
  }

  const seenIds = new Set<string>();
  const sections: SearchSection[] = [];

  for (const section of hSections) {
    const subHeader = findNodeByIdPrefix(section, SUB_HEADER_PML_PREFIX);
    let title = "";
    if (subHeader) {
      title = extractSectionTitle(subHeader);
    }

    const products = extractProductsFromWrappers([section as PmlRecord], seenIds);
    if (products.length === 0) continue;

    if (!title) title = "Producten";
    sections.push({ title, products });
  }

  // If no section has a real title, return flat products instead
  const hasRealTitles = sections.some((s) => s.title !== "Producten");
  if (!hasRealTitles) {
    const allProducts = sections.flatMap((s) => s.products);
    return { sections: [], products: allProducts };
  }

  const products = sections.flatMap((s) => s.products);
  return { sections, products };
}

// ─── Fallback parser ─────────────────────────────────────────────────────────

/** Fallback: extract all products flat when no section structure is found. */
function fallbackFlatParse(rawPage: unknown): { sections: SearchSection[]; products: Product[] } {
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

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Reads the products of a Fusion page that lists product tiles (`/api/pages/products`) into
 * sections. Tries the horizontal sections of theme pages, then all tiles without sections (e.g.
 * `fresh-market-wineshop`).
 */
export function parseProductPage(rawPage: unknown): {
  sections: SearchSection[];
  products: Product[];
} {
  return parseHorizontalSellingSections(rawPage);
}
