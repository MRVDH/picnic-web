// Parser for the app's basket footer (basket-footer-section-root): the
// "Spaarpunten" line and the "Niets vergeten?" recommendation tiles. The
// rest of the app's basket comes from the /cart response.
import type { CartFooterData, CartFooterText, CartRecommendationTile } from "@/lib/core/types";
import { type PmlNode, cleanMarkdown, findNodeById } from "@/lib/pml/pml-helpers";

const LOYALTY_ID = "loyalty-point-nudge-content";
const RECOMMENDATIONS_HEADER_ID = "horizontal-selling-unit-tiles-sub-header";
const RECOMMENDATIONS_TILES_ID = "horizontal-selling-unit-tiles";
/** Tiles are PML nodes with ids like "item-s1009021", where the rest is the product id. */
const TILE_ID_PREFIX = "item-";
/** The full list the app opens from the header and the tiles. */
const RECOMMENDATIONS_PAGE_ID = "basket-recommendations-root";

/** Parse the raw basket-footer-section-root Fusion page. */
export function parseCartFooter(rawPage: unknown): CartFooterData {
  return {
    loyaltyPoints: extractLoyaltyPoints(rawPage),
    recommendations: extractRecommendations(rawPage),
  };
}

function extractLoyaltyPoints(rawPage: unknown): CartFooterData["loyaltyPoints"] {
  const [label, value] = collectTexts(findNodeById(rawPage, LOYALTY_ID));
  return label && value ? { label, value } : null;
}

function extractRecommendations(rawPage: unknown): CartFooterData["recommendations"] {
  const header = findNodeById(rawPage, RECOMMENDATIONS_HEADER_ID);
  const tilesNode = findNodeById(rawPage, RECOMMENDATIONS_TILES_ID);
  if (!tilesNode) return null;

  const tiles: CartRecommendationTile[] = [];
  for (const child of asArray(tilesNode.children)) {
    const tile = extractTile(child);
    if (tile) tiles.push(tile);
  }
  if (tiles.length === 0) return null;

  // The header's first text is the title; the chevron after it is a separate text.
  const title = collectTexts(header)[0]?.text ?? "";
  return { title, pageId: RECOMMENDATIONS_PAGE_ID, tiles };
}

function extractTile(node: unknown): CartRecommendationTile | null {
  if (!isRecord(node) || typeof node.id !== "string" || !node.id.startsWith(TILE_ID_PREFIX)) {
    return null;
  }
  const image = findFirst(node, (candidate) => candidate.type === "IMAGE");
  const imageId = (image?.source as { id?: unknown } | undefined)?.id;
  if (typeof imageId !== "string" || imageId === "") return null;

  const container = findFirst(node, (candidate) => typeof candidate.backgroundColor === "string");
  return {
    productId: node.id.slice(TILE_ID_PREFIX.length),
    imageId,
    backgroundColor: (container?.backgroundColor as string | undefined) ?? null,
    hasPromo:
      findFirst(
        node,
        (candidate) => candidate.type === "ICON" && candidate.iconKey === "percentage"
      ) !== null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** RICH_TEXT nodes with their text and color, in document order. */
function collectTexts(node: unknown, out: CartFooterText[] = []): CartFooterText[] {
  if (Array.isArray(node)) {
    for (const item of node) collectTexts(item, out);
    return out;
  }
  if (!isRecord(node)) return out;
  if (node.type === "RICH_TEXT" && typeof node.markdown === "string") {
    const text = cleanMarkdown(node.markdown);
    const color = (node.textAttributes as { color?: unknown } | undefined)?.color;
    if (text) out.push({ text, color: typeof color === "string" ? color : null });
    return out;
  }
  for (const value of Object.values(node)) collectTexts(value, out);
  return out;
}

function findFirst(node: unknown, predicate: (node: PmlNode) => boolean): PmlNode | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirst(item, predicate);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(node)) return null;
  if (predicate(node)) return node;
  for (const value of Object.values(node)) {
    const found = findFirst(value, predicate);
    if (found) return found;
  }
  return null;
}

function isRecord(value: unknown): value is PmlNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
