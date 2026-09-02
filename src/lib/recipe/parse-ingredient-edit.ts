import type {
  IngredientAlternative,
  IngredientAlternativeGroup,
  IngredientEditData,
} from "@/lib/core/types";
import { cleanMarkdown, collectMarkdowns, findNodeById } from "@/lib/pml/pml-helpers";

type PmlRecord = Record<string, unknown>;

const GROUP_ID_PREFIX = "editable-selling-unit-list-";
const SUBHEADER_ID_PREFIX = "editable-selling-unit-list-subheader-";
const TILE_ID_RE = /^core_selling_unit_(s\d+)_stepper_state$/;
const PRICE_RE = /^\d+[.,]\d{2}$/;
const QUANTITY_RE =
  /^\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:g|kg|ml|cl|l|st|stk|stuks?|st[üu]ck|pack)\.?$/i;
/** Every tile repeats the same page background image before the product image. */
const BACKGROUND_IMAGE_PREFIX = "picnic-page/";
/** A real name has at least two letters; this rejects "300g" and bare numbers. */
const HAS_WORD_RE = /\p{L}{2}/u;

/** Collect every node in the tree matching a predicate, outermost first. */
function collectNodes(obj: unknown, match: (node: PmlRecord) => boolean): PmlRecord[] {
  const found: PmlRecord[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value !== "object" || value === null) return;
    const record = value as PmlRecord;
    if (match(record)) {
      found.push(record);
      return;
    }
    for (const child of Object.values(record)) walk(child);
  };
  walk(obj);
  return found;
}

/** The product image is the first IMAGE that is not the shared page background. */
function extractProductImageId(node: unknown): string | null {
  const images = collectNodes(node, (n) => n.type === "IMAGE");
  for (const image of images) {
    const source = (image.source ?? image.fallbackSource) as { id?: string } | undefined;
    const id = source?.id;
    if (typeof id === "string" && !id.startsWith(BACKGROUND_IMAGE_PREFIX)) return id;
  }
  return null;
}

type PromotionData = {
  price?: number;
  strikethrough_price?: number;
  promotion_label?: string;
  show_strikethrough_price?: boolean;
};

/** Read the promotion analytics context, which carries exact cent amounts. */
function extractPromotion(node: unknown): PromotionData | null {
  const carriers = collectNodes(
    node,
    (n) => typeof n.analytics === "object" && n.analytics !== null
  );
  for (const carrier of carriers) {
    const contexts = (carrier.analytics as { contexts?: unknown[] }).contexts ?? [];
    for (const context of contexts) {
      if (typeof context !== "object" || context === null) continue;
      const entry = context as PmlRecord;
      if (typeof entry.schema === "string" && entry.schema.includes("/promotion/")) {
        return (entry.data as PromotionData | undefined) ?? null;
      }
    }
  }
  return null;
}

function toCents(text: string): number {
  return Math.round(parseFloat(text.replace(",", ".")) * 100);
}

function parseTile(node: PmlRecord, sellingUnitId: string): IngredientAlternative {
  const lines = collectMarkdowns(node)
    .map((md) => cleanMarkdown(md).trim())
    .filter(Boolean);

  const promotion = extractPromotion(node);
  const promotionLabel = promotion?.promotion_label ?? null;

  // The brand always follows the chevron row; unavailable tiles have neither.
  const chevronIndex = lines.indexOf(">");
  const brand = chevronIndex >= 0 ? (lines[chevronIndex + 1] ?? null) : null;

  const prices = lines.filter((line) => PRICE_RE.test(line));
  const displayPrice = promotion?.price ?? (prices[0] ? toCents(prices[0]) : 0);
  const strikethrough = promotion?.strikethrough_price ?? (prices[1] ? toCents(prices[1]) : null);
  // Only treat it as a discount when it is actually higher than what you pay.
  const originalPrice =
    strikethrough !== null && strikethrough !== undefined && strikethrough > displayPrice
      ? strikethrough
      : null;

  const quantityIndex = lines.findIndex((line) => QUANTITY_RE.test(line));
  const unitQuantity = quantityIndex >= 0 ? lines[quantityIndex] : "";

  const name =
    lines.find(
      (line) =>
        line !== ">" &&
        line !== brand &&
        line !== promotionLabel &&
        !PRICE_RE.test(line) &&
        !QUANTITY_RE.test(line) &&
        HAS_WORD_RE.test(line)
    ) ?? "";

  // An unavailable tile shows a reason where the price would be.
  const isUnavailable = prices.length === 0 && promotion?.price === undefined;
  const trailing =
    quantityIndex >= 0
      ? lines.slice(quantityIndex + 1).filter((line) => HAS_WORD_RE.test(line) && line !== name)
      : [];

  return {
    id: sellingUnitId,
    name,
    brand,
    imageId: extractProductImageId(node),
    displayPrice,
    originalPrice,
    promotionLabel,
    unitQuantity,
    tags: isUnavailable ? [] : trailing,
    isUnavailable,
    unavailableReason: isUnavailable ? (trailing[0] ?? null) : null,
  };
}

/** Read the saved selection off the page's root state boundary. */
function extractSelected(rawPage: unknown): Record<string, number> {
  const boundaries = collectNodes(rawPage, (n) => n.id === "SellingGroupComponentEditingRootState");
  const state = boundaries[0]?.state as
    | { originallySelectedSellingUnits?: Record<string, number> }
    | undefined;
  return state?.originallySelectedSellingUnits ?? {};
}

/**
 * Parse a selling-group-component-edit-page Fusion page into typed alternatives.
 *
 * Groups are BLOCKs whose id starts with `editable-selling-unit-list-`; the group
 * title is the id suffix. Each alternative sits under a node whose id encodes its
 * selling unit id.
 *
 * The page's own `unavailableSellingUnitIds` is deliberately ignored: it comes
 * back empty even on pages that render "Produkt nicht mehr lieferbar", so
 * availability is read off each tile instead.
 */
export function parseIngredientEdit(rawPage: unknown, ingredientId: string): IngredientEditData {
  const header = findNodeById(rawPage, "ingredient-editing-header");
  const headerLines = header
    ? collectMarkdowns(header)
        .map((md) => cleanMarkdown(md).trim())
        .filter(Boolean)
    : [];
  // Line 0 is the page title ("Zutat anpassen"), which the UI supplies itself.
  const subtitle = headerLines[1] ?? "";

  const groupNodes = collectNodes(
    rawPage,
    (n) =>
      typeof n.id === "string" &&
      n.id.startsWith(GROUP_ID_PREFIX) &&
      !n.id.startsWith(SUBHEADER_ID_PREFIX)
  );

  const groups: IngredientAlternativeGroup[] = [];
  for (const groupNode of groupNodes) {
    const title = (groupNode.id as string).slice(GROUP_ID_PREFIX.length);
    const tiles = collectNodes(groupNode, (n) => typeof n.id === "string" && TILE_ID_RE.test(n.id));
    const alternatives = tiles.map((tile) => {
      const match = TILE_ID_RE.exec(tile.id as string);
      return parseTile(tile, match ? match[1] : "");
    });
    if (alternatives.length > 0) groups.push({ title, alternatives });
  }

  return { ingredientId, subtitle, groups, selected: extractSelected(rawPage) };
}
