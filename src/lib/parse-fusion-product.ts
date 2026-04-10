// Fusion product page parser.
// Extracts a ProductDetail from the raw product-details-page-root response.

import type {
  ProductDetail,
  AllergenInfo,
  AllergenBadge,
  ProductInfoSection,
  ProductLabel,
  ProductHighlightItem,
  NutritionRow,
} from "./types";
import {
  PRODUCT_MAIN_CONTAINER_ID,
  PRODUCT_GALLERY_CONTAINER_ID,
  PRODUCT_DESCRIPTION_ID,
  PRODUCT_HIGHLIGHTS_ID,
  PRODUCT_ALLERGIES_ID,
  PRODUCT_ACCORDION_ID,
  PRODUCT_LABELS_PREFIX,
} from "./types";
import {
  collectMarkdowns,
  stripColorTags,
  cleanMarkdown,
  extractInnerColor,
  findNodeById,
  findNodeByIdPrefix,
  collectPropertyValues,
} from "./pml-helpers";
import {
  collectPriceNodes,
  collectHighlightRows,
  collectLabels,
  collectNutritionRows,
  collectAllergenGroups,
} from "./pml-product-helpers";
import {
  findMainSellingUnit,
  resolveDisplayPrice,
  extractPromotion,
  extractBundles,
  extractSimilarProducts,
} from "./extract-product-data";

// ─── Internal extraction helpers ─────────────────────────────────────────────

/** Extract name, brand, unitQuantity, unitPrice, and category tag from the main container. */
function extractMainContainerInfo(page: unknown): {
  name: string;
  brand: string;
  unitQuantity: string;
  unitPrice: string | null;
  categoryTag: { text: string; color: string } | null;
} {
  const mainContainer = findNodeById(page, PRODUCT_MAIN_CONTAINER_ID);
  const texts = collectMarkdowns(mainContainer).map((md) => md);

  // Positional: 0=name, 1=brand, 2=unitQuantity, 3=unitPrice, 4=categoryTag (optional)
  const name = stripColorTags(texts[0] ?? "");
  const brand = stripColorTags(texts[1] ?? "");
  const unitQuantity = stripColorTags(texts[2] ?? "");
  const unitPrice = texts[3] ? stripColorTags(texts[3]) || null : null;

  // Category tag (e.g. "Diepvries") at position 4 with a distinct inner color
  let categoryTag: { text: string; color: string } | null = null;
  if (texts[4]) {
    const color = extractInnerColor(texts[4]);
    const text = stripColorTags(texts[4]);
    if (text && color) {
      categoryTag = { text, color };
    }
  }

  return { name, brand, unitQuantity, unitPrice, categoryTag };
}

/** Extract gallery image IDs from the image gallery container. */
function extractImageIds(page: unknown, fallbackImageId: string): string[] {
  const gallery = findNodeById(page, PRODUCT_GALLERY_CONTAINER_ID);
  if (!gallery) {
    return fallbackImageId ? [fallbackImageId] : [];
  }

  const sourceIds = collectPropertyValues(gallery, "source")
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => s.id)
    .filter((id): id is string => typeof id === "string");

  const uniqueIds = [...new Set(sourceIds)];
  return uniqueIds.length > 0 ? uniqueIds : fallbackImageId ? [fallbackImageId] : [];
}

/** Extract product description text. */
function extractDescription(page: unknown): string | null {
  const descBlock = findNodeById(page, PRODUCT_DESCRIPTION_ID);
  const markdowns = collectMarkdowns(descBlock);
  return markdowns.length > 0 ? markdowns.join("\n") : null;
}

/** Extract highlight items with icons and optional links. */
function extractHighlights(page: unknown): ProductHighlightItem[] {
  const highlightsBlock = findNodeById(page, PRODUCT_HIGHLIGHTS_ID);
  if (!highlightsBlock) return [];

  const rows = collectHighlightRows(highlightsBlock);
  return rows.map((row) => ({
    text: row.markdown,
    iconKey: row.iconKey,
    linkTarget: row.linkTarget,
  }));
}

/** Extract allergens with confirmed/mayContain categorization and badge colors. */
function extractAllergens(page: unknown): AllergenInfo {
  const allergiesBlock = findNodeById(page, PRODUCT_ALLERGIES_ID);
  if (!allergiesBlock) return { confirmed: [], mayContain: [] };

  const groups = collectAllergenGroups(allergiesBlock);

  const confirmed: AllergenBadge[] = [];
  const mayContain: AllergenBadge[] = [];

  for (const group of groups) {
    const target = group.category === "mayContain" ? mayContain : confirmed;
    for (const badge of group.badges) {
      target.push({
        text: badge.text,
        backgroundColor: badge.backgroundColor,
        textColor: badge.textColor,
      });
    }
  }

  return { confirmed, mayContain };
}

/** Extract accordion info sections. */
function extractInfoSections(page: unknown): ProductInfoSection[] {
  const accordionBlock = findNodeById(page, PRODUCT_ACCORDION_ID);
  if (!accordionBlock) return [];

  const itemsArrays = collectPropertyValues(accordionBlock, "items");
  const items = Array.isArray(itemsArrays[0]) ? itemsArrays[0] : [];
  const sections: ProductInfoSection[] = [];

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;

    const headerTexts = collectMarkdowns(record.header).map(cleanMarkdown);
    const bodyTexts = collectMarkdowns(record.body).map(stripColorTags);

    const title = headerTexts[0] ?? "";
    const content = bodyTexts.join("\n");

    if (title) {
      sections.push({ title, content });
    }
  }

  return sections;
}

/** Extract product labels from the labels container. */
function extractLabels(page: unknown): ProductLabel[] {
  const labelsNode = findNodeByIdPrefix(page, PRODUCT_LABELS_PREFIX);
  if (!labelsNode) return [];

  return collectLabels(labelsNode);
}

/** Extract original (crossed-out) price from the main container. */
function extractOriginalPrice(page: unknown): number | null {
  const mainContainer = findNodeById(page, PRODUCT_MAIN_CONTAINER_ID);
  if (!mainContainer) return null;

  const priceNodes = collectPriceNodes(mainContainer);
  const crossedPrice = priceNodes.find((p) => p.isCrossed);
  return crossedPrice?.price ?? null;
}

/** Extract structured nutrition rows from the Voedingswaarde accordion item. */
function extractNutritionRows(page: unknown): NutritionRow[] {
  const accordionBlock = findNodeById(page, PRODUCT_ACCORDION_ID);
  if (!accordionBlock) return [];

  const itemsArrays = collectPropertyValues(accordionBlock, "items");
  const items = Array.isArray(itemsArrays[0]) ? itemsArrays[0] : [];

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const headerTexts = collectMarkdowns(record.header).map(cleanMarkdown);
    const title = headerTexts[0] ?? "";

    if (title.toLowerCase().includes("voedingswaarde")) {
      return collectNutritionRows(record.body);
    }
  }

  return [];
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse a raw product-details-page-root Fusion page into a ProductDetail.
 *
 * Navigates the PML tree using known node IDs and positional markdown
 * extraction, following the same patterns as picnic-api's extractProductDetails
 * but using local pml-helpers utilities instead of jsonpath-plus.
 */
export function parseProductDetailPage(
  rawPage: unknown,
  productId: string,
): ProductDetail {
  // The page has a `.body` wrapper from the Fusion response
  const page = (rawPage as Record<string, unknown>)?.body ?? rawPage;

  const mainInfo = extractMainContainerInfo(page);
  const mainUnit = findMainSellingUnit(rawPage, productId);
  const displayPrice = resolveDisplayPrice(
    page,
    productId,
    mainUnit.displayPrice,
  );

  const promotion = extractPromotion(rawPage);

  // Filter out promotion badges from labels — the promotion is already
  // rendered separately in ProductPriceSection, so showing it in labels
  // too would duplicate it.
  const labels = extractLabels(page).filter(
    (l) => !promotion || l.text !== promotion.label,
  );

  return {
    id: productId,
    name: mainInfo.name,
    brand: mainInfo.brand,
    unitQuantity: mainInfo.unitQuantity,
    unitPrice: mainInfo.unitPrice,
    categoryTag: mainInfo.categoryTag,
    displayPrice,
    originalPrice: extractOriginalPrice(page),
    maxCount: mainUnit.maxCount,
    imageIds: extractImageIds(page, mainUnit.imageId),
    labels,
    description: extractDescription(page),
    highlights: extractHighlights(page),
    allergens: extractAllergens(page),
    infoSections: extractInfoSections(page),
    promotion,
    bundles: extractBundles(page),
    similarProducts: extractSimilarProducts(page),
    nutritionRows: extractNutritionRows(page),
  };
}
