// Per-tile data extraction for converting PML selling-unit tiles into Product metadata.

import type { BadgeVariant, Highlight } from "./types";
import type { PmlNode, AnalyticsContext } from "./pml-helpers";
import {
  stripColorTags,
  cleanMarkdown,
  extractInnerColor,
  collectMarkdowns,
  findIconNodes,
} from "./pml-helpers";

/** Extract a promotion label from the analytics contexts (e.g. "3 voor €5"). */
export function extractPromotionLabel(
  contexts: AnalyticsContext[] | undefined,
): string | null {
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
 * Navigate to the text-info STACK in the PML and return its children.
 * Path: component > children[1] > ... > STACK(axis=VERTICAL, spacing).
 */
export function findTextStackChildren(
  pml: PmlNode | undefined,
): PmlNode[] | null {
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

/** Classify text stack rows and extract structured product info. */
export function extractTextStackInfo(
  stackChildren: PmlNode[] | null,
  suName: string,
  unitQuantity: string,
): {
  subtitle: string | null;
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
    const text = markdowns.map((m) => cleanMarkdown(m)).filter(Boolean).join(" ");
    if (text) {
      result.subtitle = text;
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
      const remaining = boldMatch[2].replace(/\s+$/, "").replace(/\u00a0/g, "").trim();
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
export function extractUnavailabilityFromPml(
  pml: PmlNode | undefined,
): { isUnavailable: boolean; reason: string | null } {
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
  displayPrice: number,
): number | null {
  if (!stackChildren) return null;

  // Look for a price row that has a strikethrough price
  for (const child of stackChildren) {
    const markdowns = collectMarkdowns(child);
    const cleanTexts = markdowns
      .map((m) => cleanMarkdown(m))
      .filter((t) => t !== "" && t !== ">");

    // Look for two price-like values (current + original)
    const prices: number[] = [];
    for (const text of cleanTexts) {
      const priceMatch = text.match(/^(\d+[.,]\d{2})$/);
      if (priceMatch) {
        prices.push(
          Math.round(parseFloat(priceMatch[1].replace(",", ".")) * 100),
        );
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
