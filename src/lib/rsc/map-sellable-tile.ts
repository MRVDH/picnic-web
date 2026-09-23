// Maps an RSC sellable tile (e.g. from promo-deep-dive-content) to the web's
// Product type, so it renders with the same ProductCard as Fusion results.
import type { Badge, BundleThreshold, Product } from "@/lib/core/types";

type RecordNode = Record<string, unknown>;

/** Tiles don't carry a max count; the Fusion pages send 99, and the cart API enforces the real limit. */
const DEFAULT_MAX_COUNT = 99;
/** The app's promo pill colors: YELLOW2 background, GREY5 text. */
const PROMO_BACKGROUND_TOKEN = "YELLOW2";
const PROMO_TEXT_TOKEN = "GREY5";
const PROMO_BACKGROUND_FALLBACK = "#fbd92b";
const PROMO_TEXT_FALLBACK = "#333333";
const LABEL_POSITIONS = ["bottomLeft", "middleLeft", "topLeft", "topRight"];

/** Map a `type: "sellable"` tile to a Product, or null when it lacks an id, name or image. */
export function mapSellableTile(tile: RecordNode, tokens: Record<string, string>): Product | null {
  const id = readString(tile.id);
  const name = readString((tile.title as RecordNode | undefined)?.title);
  const imageId = readString(
    ((tile.images as RecordNode | undefined)?.primaryImage as RecordNode | undefined)?.imageId
  );
  if (tile.type !== "sellable" || !id || !name || !imageId) return null;

  const price = (tile.price ?? {}) as RecordNode;
  const priceRanges = readPriceRanges(price.priceRanges);
  const promoText = findPromoLabel(tile.labels);

  return {
    id,
    name,
    namePrefix: readString((tile.title as RecordNode).prefix),
    // The quality cue ("Op basis van doperwten") is the line above the name,
    // the subtitle ("Johma") the brand line below it.
    subtitle: readString((tile.qualityCue as RecordNode | undefined)?.text),
    subtitleColor: null,
    subtitleLeadingIcon: null,
    subtitleTrailingIcon: null,
    brand: readString((tile.subtitle as RecordNode | undefined)?.text),
    highlight: null,
    flagIconKey: null,
    flagFallbackImageId: null,
    imageId,
    displayPrice: priceRanges?.[0]?.pricePerUnit ?? toCents(price.priceValue) ?? 0,
    originalPrice: toCents(price.referencePriceValue),
    displayPriceColor: null,
    unitQuantity: readSuffixes(tile.suffixes),
    maxCount: DEFAULT_MAX_COUNT,
    priceRanges,
    badges: [],
    promoBadge: promoText ? buildPromoBadge(promoText, tokens) : null,
    promoPlacement: promoText ? "image" : null,
    isUnavailable: tile.unavailability !== null && tile.unavailability !== undefined,
    unavailableReason: null,
  };
}

function readPriceRanges(value: unknown): BundleThreshold[] | null {
  if (!Array.isArray(value)) return null;
  const ranges = value.flatMap((range) => {
    const { fromQuantity, price } = (range ?? {}) as RecordNode;
    return typeof fromQuantity === "number" && typeof price === "number"
      ? [{ quantity: fromQuantity, pricePerUnit: price }]
      : [];
  });
  return ranges.length > 0 ? ranges : null;
}

/** The first PROMO label in any label position, e.g. "1+1 gratis". */
function findPromoLabel(labels: unknown): string | null {
  const record = (labels ?? {}) as RecordNode;
  for (const position of LABEL_POSITIONS) {
    const list = record[position];
    if (!Array.isArray(list)) continue;
    for (const label of list) {
      const { type, labelText } = (label ?? {}) as RecordNode;
      if (type === "PROMO" && typeof labelText === "string" && labelText !== "") return labelText;
    }
  }
  return null;
}

function buildPromoBadge(text: string, tokens: Record<string, string>): Badge {
  return {
    text,
    variant: "promo",
    backgroundColor: tokens[PROMO_BACKGROUND_TOKEN] ?? PROMO_BACKGROUND_FALLBACK,
    textColor: tokens[PROMO_TEXT_TOKEN] ?? PROMO_TEXT_FALLBACK,
  };
}

/** Unit/quantity text from the TEXT suffixes, e.g. "175 gram". */
function readSuffixes(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .flatMap((suffix) => {
      const { type, text } = (suffix ?? {}) as RecordNode;
      return type === "TEXT" && typeof text === "string" ? [text] : [];
    })
    .join(", ");
}

/** Tile prices are in euros (3.19); the web uses cents. */
function toCents(value: unknown): number | null {
  return typeof value === "number" ? Math.round(value * 100) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
