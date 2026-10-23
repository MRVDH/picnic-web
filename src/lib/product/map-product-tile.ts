// Maps picnic-api's product tiles (search results, promotions, favorites) to the
// web's Product type, so they render with the same ProductCard as other lists.
import type PicnicClient from "picnic-api";

import type {
  Badge,
  BundleThreshold,
  FavoritesAisle,
  Product,
  PromotionsSection,
  SearchSection,
} from "@/lib/core/types";

type ProductTile = PicnicClient.Types.catalog.ProductTile;
type SearchProductResults = PicnicClient.Types.catalog.SearchProductResults;
type Promotions = PicnicClient.Types.catalog.Promotions;
type Favorites = PicnicClient.Types.catalog.Favorites;

/** Tiles don't carry a max count; the Fusion pages send 99, and the cart API enforces the real limit. */
const DEFAULT_MAX_COUNT = 99;
/** Label types that hold a promotion text, e.g. "1+1 gratis" or "2e halve prijs". */
const PROMO_LABEL_TYPES = new Set(["PROMO", "PROMOBOX_PROMO"]);
/** The app's promo pill colors: YELLOW2 background, GREY5 text. */
const PROMO_BACKGROUND_TOKEN = "YELLOW2";
const PROMO_TEXT_TOKEN = "GREY5";
const PROMO_BACKGROUND_FALLBACK = "#fbd92b";
const PROMO_TEXT_FALLBACK = "#333333";

/**
 * Map a product tile to a Product, or null when it has no image. `tokens` are
 * the page's theme colors, used for the promo pill when the page has them.
 */
export function mapProductTile(
  tile: ProductTile,
  tokens: Record<string, string> = {}
): Product | null {
  if (!tile.imageId) return null;
  const promoText = tile.labels.find(
    (label) => label.type && PROMO_LABEL_TYPES.has(label.type)
  )?.text;

  return {
    id: tile.id,
    name: tile.name,
    namePrefix: tile.namePrefix,
    // The quality cue ("Op basis van doperwten") is the line above the name,
    // the brand ("Johma") the line below it.
    subtitle: tile.qualityCue,
    subtitleColor: null,
    subtitleLeadingIcon: null,
    subtitleTrailingIcon: null,
    brand: tile.brand,
    highlight: null,
    flagIconKey: null,
    flagFallbackImageId: null,
    imageId: tile.imageId,
    displayPrice: tile.displayPrice,
    originalPrice: tile.originalPrice,
    displayPriceColor: null,
    unitQuantity: tile.unitQuantity,
    maxCount: DEFAULT_MAX_COUNT,
    priceRanges: mapPriceRanges(tile.priceRanges),
    badges: [],
    promoBadge: promoText ? buildPromoBadge(promoText, tokens) : null,
    promoPlacement: promoText ? "image" : null,
    isUnavailable: tile.isUnavailable,
    unavailableReason: null,
  };
}

/**
 * Map the product tiles in an RSC prop (e.g. `sellableTiles`) to Products.
 * picnic-api parses product tiles in RSC page content; other values (items
 * that aren't product tiles) are skipped.
 */
export function mapProductTiles(value: unknown, tokens: Record<string, string> = {}): Product[] {
  return (Array.isArray(value) ? value : []).flatMap((tile) => {
    const product = isProductTile(tile) ? mapProductTile(tile, tokens) : null;
    return product ? [product] : [];
  });
}

/**
 * Map product sections to the sections ProductGrid renders and a flat product
 * list (each product once, in section order). A section the app shows without
 * a header (`title` null) keeps its products and gets an empty title, so it
 * renders without a header. Sections without products are left out.
 */
export function mapProductSections(
  sections: { title: string | null; products: unknown }[],
  tokens: Record<string, string> = {}
): { products: Product[]; sections: SearchSection[] } {
  const products = new Map<string, Product>();
  const mapped: SearchSection[] = [];

  for (const section of sections) {
    const sectionProducts = mapProductTiles(section.products, tokens);
    for (const product of sectionProducts) {
      if (!products.has(product.id)) products.set(product.id, product);
    }
    if (sectionProducts.length > 0) {
      mapped.push({ title: section.title ?? "", products: sectionProducts });
    }
  }

  return { products: [...products.values()], sections: mapped };
}

/** Map search product results to the search page's sections and product list. */
export function mapSearchSections(results: SearchProductResults | null): {
  products: Product[];
  sections: SearchSection[];
} {
  return mapProductSections(results?.sections ?? []);
}

/** Map the promotions page's sections; sections left without products or groups are dropped. */
export function mapPromotionsSections(promotions: Promotions): PromotionsSection[] {
  return promotions.sections
    .map((section) => ({
      title: section.title,
      products: mapProductTiles(section.products),
      groups: section.groups,
    }))
    .filter((section) => section.products.length > 0 || section.groups.length > 0);
}

/** Map the favorites page's aisles; aisles the page left empty keep `complete: false`. */
export function mapFavoritesAisles(favorites: Favorites): FavoritesAisle[] {
  return favorites.aisles.map((aisle) => ({
    id: aisle.id,
    title: aisle.title,
    products: mapProductTiles(aisle.products),
    complete: aisle.complete,
  }));
}

/** Whether a value is a product tile as picnic-api parses it (it always has `labels`). */
function isProductTile(value: unknown): value is ProductTile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ProductTile).id === "string" &&
    Array.isArray((value as ProductTile).labels)
  );
}

function mapPriceRanges(ranges: ProductTile["priceRanges"]): BundleThreshold[] | null {
  if (!ranges || ranges.length === 0) return null;
  return ranges.map((range) => ({ quantity: range.from_quantity, pricePerUnit: range.price }));
}

function buildPromoBadge(text: string, tokens: Record<string, string>): Badge {
  return {
    text,
    variant: "promo",
    backgroundColor: tokens[PROMO_BACKGROUND_TOKEN] ?? PROMO_BACKGROUND_FALLBACK,
    textColor: tokens[PROMO_TEXT_TOKEN] ?? PROMO_TEXT_FALLBACK,
  };
}
