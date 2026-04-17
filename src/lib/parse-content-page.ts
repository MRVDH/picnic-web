// Parsers for content/promotional pages (campaign pages, "Nieuw" pages,
// theme pages). Extracts product sections with headers from PML trees
// that don't follow the standard search or category-tree layouts.

import type { Product, SearchSection } from "./types";
import {
  findSellingUnitContainers,
  collectMarkdowns,
  stripColorTags,
  findNodeByIdSubstring,
  findNodeByIdPrefix,
} from "./pml-helpers";
import { containerToProduct } from "./parse-fusion-search";

type PmlRecord = Record<string, unknown>;

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Extract the section title from a header node's PML markdown. */
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

/** Find all nodes whose `id` starts with the given prefix. */
function findAllByIdPrefix(
  obj: unknown,
  prefix: string,
  results: PmlRecord[] = [],
): PmlRecord[] {
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

/** Find all nodes whose `id` matches the given regex. */
function findAllByRegex(
  obj: unknown,
  regex: RegExp,
  results: PmlRecord[] = [],
): PmlRecord[] {
  if (typeof obj !== "object" || obj === null) return results;

  if (Array.isArray(obj)) {
    for (const item of obj) findAllByRegex(item, regex, results);
    return results;
  }

  const record = obj as PmlRecord;
  if (typeof record.id === "string" && regex.test(record.id)) {
    results.push(record);
    return results;
  }

  for (const value of Object.values(record)) {
    findAllByRegex(value, regex, results);
  }
  return results;
}

// ─── Campaign / promotional page parser ──────────────────────────────────────

/**
 * Regex matching campaign section IDs (with optional numeric prefix and UUID).
 * Examples:
 *   campaign-promo-section_UUID
 *   5-campaign-highlight-section_UUID
 *   campaign-selling-unit-horizontal-carousel-section_UUID
 */
const CAMPAIGN_SECTION_RE =
  /^(?:\d+-)?campaign-(?:promo|highlight|selling-unit-horizontal-carousel)-section_/;

const CORE_SUB_HEADER_SUFFIX = "-core-sub-header";

/**
 * Parse a campaign/promotional page into sections with headers.
 *
 * Campaign pages use a `campaign-page-layout-content` container whose
 * children follow a marker → section → end-marker pattern. Each section
 * node contains a `core-sub-header` child with the title (in the PML
 * markdown) and product tiles in sibling subtrees.
 */
function parseCampaignPageSections(
  rawPage: unknown,
): { sections: SearchSection[]; products: Product[] } {
  const campaignSections = findAllByRegex(rawPage, CAMPAIGN_SECTION_RE);

  if (campaignSections.length === 0) {
    return parseHorizontalSellingSections(rawPage);
  }

  const seenIds = new Set<string>();
  const sections: SearchSection[] = [];

  for (const section of campaignSections) {
    const sectionId = (section.id as string) ?? "";

    const subHeaderId = sectionId + CORE_SUB_HEADER_SUFFIX;
    const subHeader = findNodeByIdSubstring(section, subHeaderId);
    let title = "";
    if (subHeader) {
      title = extractSectionTitle(subHeader);
    }

    const products = extractProductsFromWrappers([section], seenIds);
    if (products.length === 0) continue;

    if (!title) title = "Producten";
    sections.push({ title, products });
  }

  const products = sections.flatMap((s) => s.products);
  return { sections, products };
}

// ─── Horizontal selling-unit section parser ──────────────────────────────────

const HORIZONTAL_SECTION_PREFIX =
  "core-horizontal-selling-unit-section-localized";
const SUB_HEADER_PML_PREFIX =
  "horizontal-selling-unit-tiles-sub-header-pml";

/**
 * Parse pages using `core-horizontal-selling-unit-section-localized`
 * containers (e.g. "Nieuw", theme pages). Each section may contain a
 * `horizontal-selling-unit-tiles-sub-header-pml` node with the title.
 */
function parseHorizontalSellingSections(
  rawPage: unknown,
): { sections: SearchSection[]; products: Product[] } {
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

    const products = extractProductsFromWrappers(
      [section as PmlRecord],
      seenIds,
    );
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

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse a content/promotional page into sections. Tries campaign layout
 * first, then horizontal-selling-unit layout, then flat product extraction.
 */
export function parseContentPageSections(
  rawPage: unknown,
): { sections: SearchSection[]; products: Product[] } {
  return parseCampaignPageSections(rawPage);
}
