// Per-tile data extraction for converting PML selling-unit tiles into Product metadata.
import type { AnalyticsContext, PmlNode } from "@/lib/pml/pml-helpers";
import {
  cleanMarkdown,
  collectMarkdowns,
  extractInnerColor,
  findIconNodes,
  stripColorTags,
} from "@/lib/pml/pml-helpers";
import { collectLabels } from "@/lib/pml/pml-product-helpers";
import type { Badge, BadgeVariant, Highlight, PromoPlacement, SubtitleIcon } from "@/lib/core/types";

/** Extract a promotion label from the analytics contexts (e.g. "3 voor €5"). */
export function extractPromotionLabel(contexts: AnalyticsContext[] | undefined): string | null {
  if (!contexts) return null;
  for (const ctx of contexts) {
    if (ctx.schema?.includes("promotion")) {
      const label = ctx.data?.promotion_label;
      if (typeof label === "string" && label.trim() !== "") {
        return label.trim();
      }
    }
  }
  return null;
}

/**
 * Build the promotion badge for a selling-unit tile, with its placement.
 *
 * The label text comes from the analytics contexts, but its color is rendered
 * in the tile PML as a CONTAINER+backgroundColor pill (same structure as the
 * product page labels). We match the two by text to pick up the API-driven
 * color (e.g. green "Family", yellow "20% korting") instead of the hardcoded
 * yellow `promo` fallback.
 *
 * Placement mirrors the app: if the pill lives in the text stack (next to the
 * price) it is "inline"; if it only appears elsewhere in the tile (overlaid on
 * the product image) it is "image". `stackChildren` is the text-stack subtree
 * from {@link findTextStackChildren}.
 */
export function extractPromotionBadge(
  contexts: AnalyticsContext[] | undefined,
  pml: PmlNode | undefined,
  stackChildren: PmlNode[] | null
): { badge: Badge; placement: PromoPlacement } | null {
  const label = extractPromotionLabel(contexts);
  if (!label) return null;

  // collectLabels strips color tags but keeps bold markers, while the analytics
  // label is plain text — normalize both sides before matching.
  const matches = (l: { text: string }) => cleanMarkdown(l.text) === label;

  // The pill is inline when it appears within the text stack (by the price).
  const inline = collectLabels(stackChildren).find(matches);
  const colored = inline ?? collectLabels(pml).find(matches);

  return {
    badge: {
      text: label,
      variant: "promo",
      backgroundColor: colored?.backgroundColor,
      textColor: colored?.textColor,
    },
    placement: inline ? "inline" : "image",
  };
}

/**
 * Navigate to the text-info STACK in the PML and return its children.
 * Path: component > children[1] > ... > STACK(axis=VERTICAL, spacing).
 */
export function findTextStackChildren(pml: PmlNode | undefined): PmlNode[] | null {
  if (!pml) return null;

  const component = pml.component as PmlNode | undefined;
  if (!component) return null;

  const topChildren = component.children as PmlNode[] | undefined;
  if (!topChildren || topChildren.length < 2) return null;

  // Recursively find the vertical STACK with spacing in the text area
  function findVerticalStack(node: unknown, depth: number): PmlNode | null {
    if (depth > 5 || typeof node !== "object" || node === null) return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const r = findVerticalStack(item, depth + 1);
        if (r) return r;
      }
      return null;
    }
    const record = node as PmlNode;
    if (
      record.type === "STACK" &&
      record.axis === "VERTICAL" &&
      typeof record.spacing === "number" &&
      Array.isArray(record.children)
    ) {
      return record;
    }
    for (const value of Object.values(record)) {
      const r = findVerticalStack(value, depth + 1);
      if (r) return r;
    }
    return null;
  }

  const textArea = topChildren[1];
  const stack = findVerticalStack(textArea, 0);
  return (stack?.children as PmlNode[] | undefined) ?? null;
}

/** Known product size labels that should use the "size" badge variant. */
export const SIZE_LABELS = new Set(["Klein", "XL", "Groot"]);

/**
 * Split the decorative icons in a subtitle row into the one before the text
 * (leading) and the one after it (trailing) — e.g. a laurel leaf on each side.
 * Flattens the row into an ordered stream of icon/text tokens and splits at the
 * text position. Returns nulls when the row has no flanking icons.
 */
function splitFlankingIcons(row: PmlNode): {
  leading: SubtitleIcon | null;
  trailing: SubtitleIcon | null;
} {
  type Token = { kind: "icon"; icon: SubtitleIcon } | { kind: "text" };
  const tokens: Token[] = [];

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const record = node as Record<string, unknown>;

    if (record.type === "ICON" && typeof record.iconKey === "string") {
      const fallback = record.fallback as { id?: string } | undefined;
      if (fallback?.id) {
        tokens.push({
          kind: "icon",
          icon: {
            imageId: fallback.id,
            color: typeof record.color === "string" ? record.color : null,
          },
        });
      }
      return; // don't descend into the icon's internals
    }

    if (typeof record.markdown === "string" && cleanMarkdown(record.markdown) !== "") {
      tokens.push({ kind: "text" });
    }

    for (const value of Object.values(record)) walk(value);
  };
  walk(row);

  const firstTextIdx = tokens.findIndex((t) => t.kind === "text");
  if (firstTextIdx === -1) {
    const firstIcon = tokens.find((t): t is { kind: "icon"; icon: SubtitleIcon } => t.kind === "icon");
    return { leading: firstIcon?.icon ?? null, trailing: null };
  }
  const lastTextIdx = tokens.map((t) => t.kind).lastIndexOf("text");

  let leading: SubtitleIcon | null = null;
  let trailing: SubtitleIcon | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== "icon") continue;
    if (i < firstTextIdx && !leading) leading = t.icon;
    else if (i > lastTextIdx && !trailing) trailing = t.icon;
  }
  return { leading, trailing };
}

/** Classify text stack rows and extract structured product info. */
export function extractTextStackInfo(
  stackChildren: PmlNode[] | null,
  suName: string,
  unitQuantity: string
): {
  subtitle: string | null;
  subtitleColor: string | null;
  subtitleLeadingIcon: SubtitleIcon | null;
  subtitleTrailingIcon: SubtitleIcon | null;
  displayName: string | null;
  namePrefix: string | null;
  brand: string | null;
  highlight: Highlight | null;
  flagIconKey: string | null;
  flagFallbackImageId: string | null;
  extraLabel: { text: string; variant: BadgeVariant } | null;
} {
  const result = {
    subtitle: null as string | null,
    subtitleColor: null as string | null,
    subtitleLeadingIcon: null as SubtitleIcon | null,
    subtitleTrailingIcon: null as SubtitleIcon | null,
    displayName: null as string | null,
    namePrefix: null as string | null,
    brand: null as string | null,
    highlight: null as Highlight | null,
    flagIconKey: null as string | null,
    flagFallbackImageId: null as string | null,
    extraLabel: null as { text: string; variant: BadgeVariant } | null,
  };

  if (!stackChildren || stackChildren.length < 3) return result;

  // Step 1: Find the name row index.
  // The name row contains either a "PicnicSymbols" font reference (chevron ">")
  // or has numberOfLines=2 on its RICH_TEXT. We search for PicnicSymbols first.
  let nameRowIdx = -1;
  for (let i = 0; i < stackChildren.length; i++) {
    const json = JSON.stringify(stackChildren[i]);
    if (json.includes("PicnicSymbols")) {
      nameRowIdx = i;
      break;
    }
  }

  // Fallback: the name row is the first or second row (depending on whether
  // there's a subtitle). We use a heuristic: if we have 5+ rows, the name
  // is at index 1; if 4 rows, it's at index 0.
  if (nameRowIdx === -1) {
    nameRowIdx = stackChildren.length >= 5 ? 1 : 0;
  }

  // Step 2: Extract subtitle (rows before the name row)
  if (nameRowIdx > 0) {
    const subtitleRow = stackChildren[0];
    const markdowns = collectMarkdowns(subtitleRow);
    const text = markdowns
      .map((m) => cleanMarkdown(m))
      .filter(Boolean)
      .join(" ");
    if (text) {
      result.subtitle = text;

      // The subtitle can carry a distinct color tag (e.g. a gold taste
      // descriptor) that cleanMarkdown strips — recover it like `highlight` does.
      for (const md of markdowns) {
        const color = extractInnerColor(md);
        if (color) {
          result.subtitleColor = color;
          break;
        }
      }

      // The subtitle row can be flanked by decorative icons (e.g. laurel
      // leaves). Split them by whether they appear before or after the text.
      const { leading, trailing } = splitFlankingIcons(subtitleRow);
      result.subtitleLeadingIcon = leading;
      result.subtitleTrailingIcon = trailing;
    }
  }

  // Step 3: Extract name and prefix from the name row
  const nameRow = stackChildren[nameRowIdx];
  const nameMarkdowns = collectMarkdowns(nameRow);
  for (const md of nameMarkdowns) {
    // Skip the chevron character
    if (cleanMarkdown(md) === ">" || cleanMarkdown(md) === "") continue;

    // Check for bold prefix: #(#628003)**Bio**#(#628003) trostomaten
    const stripped = stripColorTags(md);
    const boldMatch = stripped.match(/\*\*([^*]+)\*\*\s+(.*)/);
    if (boldMatch) {
      result.namePrefix = boldMatch[1].trim();
      const remaining = boldMatch[2]
        .replace(/\s+$/, "")
        .replace(/\u00a0/g, "")
        .trim();
      if (remaining) result.displayName = remaining;
    } else {
      const clean = cleanMarkdown(md);
      if (clean && clean !== ">") {
        result.displayName = clean;
      }
    }
  }

  // Step 4: Extract brand/subtext row (the row after the name row)
  const brandRowIdx = nameRowIdx + 1;
  if (brandRowIdx < stackChildren.length - 2) {
    // The brand/subtext row is before price and unit rows
    const brandRow = stackChildren[brandRowIdx];

    // Check for flag icons in this row
    const icons = findIconNodes(brandRow);
    for (const icon of icons) {
      if (icon.iconKey.startsWith("flag")) {
        result.flagIconKey = icon.iconKey;
        result.flagFallbackImageId = icon.fallbackId;
        break;
      }
    }

    // Extract text content
    const markdowns = collectMarkdowns(brandRow);
    for (const md of markdowns) {
      const clean = cleanMarkdown(md);
      if (!clean || clean === ">" || clean === "·") continue;

      // Check for highlight color (e.g. Prijskampioen in red)
      const highlightColor = extractInnerColor(md);
      if (highlightColor) {
        result.highlight = { text: clean, color: highlightColor };
      } else {
        result.brand = clean;
      }
    }
  }

  // Step 5: Extract extra label from the last row (unit quantity row)
  const lastChild = stackChildren[stackChildren.length - 1];
  const lastMarkdowns = collectMarkdowns(lastChild);
  const cleanTexts = lastMarkdowns
    .map((m) => cleanMarkdown(m))
    .filter((t) => t !== "" && t !== ">");

  const UNIT_PATTERNS = /gram|liter|stuks|kilo|\bml\b|\bcl\b|\bkg\b/i;

  for (const text of cleanTexts) {
    if (text === unitQuantity || UNIT_PATTERNS.test(text)) continue;

    if (SIZE_LABELS.has(text)) {
      result.extraLabel = { text, variant: "size" };
    } else if (text.startsWith("€") || text.includes("/l") || text.includes("/kg")) {
      result.extraLabel = { text, variant: "unit-price" };
    } else {
      result.extraLabel = { text, variant: "info" };
    }
    break;
  }

  return result;
}

/**
 * Extract unavailability info from the PML.
 * Checks the accessibilityLabel ("ProductName,Reason") and known markers.
 */
export function extractUnavailabilityFromPml(pml: PmlNode | undefined): {
  isUnavailable: boolean;
  reason: string | null;
} {
  if (!pml) return { isUnavailable: false, reason: null };

  const component = pml.component as PmlNode | undefined;
  if (!component) return { isUnavailable: false, reason: null };

  const topChildren = component.children as PmlNode[] | undefined;
  if (!topChildren) return { isUnavailable: false, reason: null };

  // Check for unavailability container (the third child in unavailable products)
  for (const child of topChildren) {
    const a11yLabel = child.accessibilityLabel;
    if (typeof a11yLabel === "string" && a11yLabel.includes(",")) {
      // Format: "ProductName,Reason" e.g. "Pruimtomaten,Snel weer terug"
      const commaIdx = a11yLabel.indexOf(",");
      const reason = a11yLabel.substring(commaIdx + 1).trim();
      if (reason) {
        return { isUnavailable: true, reason };
      }
    }
  }

  // Also check for known unavailability markers in the PML text
  const allMarkdowns = collectMarkdowns(pml);
  for (const md of allMarkdowns) {
    const clean = cleanMarkdown(md);
    if (
      clean === "Snel weer terug" ||
      clean === "Tijdelijk niet leverbaar" ||
      clean === "Niet meer leverbaar"
    ) {
      return { isUnavailable: true, reason: clean };
    }
  }

  return { isUnavailable: false, reason: null };
}

/**
 * Extract the original (pre-discount) price from the PML text stack.
 * Finds strikethrough price alongside current price in promotion rows.
 */
export function extractOriginalPriceFromPml(
  stackChildren: PmlNode[] | null,
  displayPrice: number
): number | null {
  if (!stackChildren) return null;

  // Look for a price row that has a strikethrough price
  for (const child of stackChildren) {
    const markdowns = collectMarkdowns(child);
    const cleanTexts = markdowns.map((m) => cleanMarkdown(m)).filter((t) => t !== "" && t !== ">");

    // Look for two price-like values (current + original)
    const prices: number[] = [];
    for (const text of cleanTexts) {
      const priceMatch = text.match(/^(\d+[.,]\d{2})$/);
      if (priceMatch) {
        prices.push(Math.round(parseFloat(priceMatch[1].replace(",", ".")) * 100));
      }
    }

    if (prices.length === 2) {
      // The strikethrough (original) price is typically higher
      const original = Math.max(...prices);
      if (original > displayPrice) {
        return original;
      }
    }
  }

  return null;
}

/** Default price text colors that shouldn't override the UI's default styling. */
const DEFAULT_PRICE_COLORS = new Set(["#333333", "#5b534e", "#787570"]);

/**
 * Find the API-driven color of the current (display) price in a tile.
 *
 * Search/PLP tiles render the price as a RICH_TEXT node whose color lives in
 * `textAttributes.color` (e.g. green "#3F7326" for a member/family discount, red
 * for a clearance markdown) — not in a markdown color tag and not a PRICE
 * component. Finds the RICH_TEXT node whose value equals the display price and
 * returns its color, or null when the price uses a default text color so the UI
 * keeps its default styling.
 */
export function extractDisplayPriceColor(
  stackChildren: PmlNode[] | null,
  displayPrice: number
): string | null {
  if (!stackChildren) return null;

  let found: string | null = null;

  const walk = (node: unknown): void => {
    if (found) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const record = node as Record<string, unknown>;

    const md = record.markdown;
    if (typeof md === "string") {
      const match = cleanMarkdown(md).match(/^€?\s*(\d+)[.,](\d{2})$/);
      if (match) {
        const cents = parseInt(match[1], 10) * 100 + parseInt(match[2], 10);
        if (cents === displayPrice) {
          const attrs = record.textAttributes as { color?: unknown } | undefined;
          const color = typeof attrs?.color === "string" ? attrs.color : null;
          if (color && !DEFAULT_PRICE_COLORS.has(color.toLowerCase())) {
            found = color;
            return;
          }
        }
      }
    }

    for (const value of Object.values(record)) walk(value);
  };

  walk(stackChildren);
  return found;
}
