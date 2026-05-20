// PML traversal helpers specific to product detail page extraction.
// Extracts PRICE nodes, highlight rows, label badges, allergen badges,
// and nutrition rows.
import type { PmlNode } from "./pml-helpers";
import { collectMarkdowns, collectPropertyValues, stripColorTags } from "./pml-helpers";

// ─── Price nodes ─────────────────────────────────────────────────────────────

/** Collected PRICE node data from the PML tree. */
export type PriceNode = {
  price: number;
  isCrossed: boolean;
  color: string | null;
};

/** Collect all PRICE-type nodes from a PML subtree. */
export function collectPriceNodes(node: unknown): PriceNode[] {
  const results: PriceNode[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectPriceNodes(item));
    }
    return results;
  }

  const record = node as Record<string, unknown>;
  if (record.type === "PRICE" && typeof record.price === "number") {
    results.push({
      price: record.price as number,
      isCrossed: (record.isCrossed as boolean) === true,
      color: (record.color as string) ?? null,
    });
  }
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      results.push(...collectPriceNodes(value));
    }
  }
  return results;
}

// ─── Highlight rows ──────────────────────────────────────────────────────────

/** A highlight row extracted from the PML highlights section. */
export type HighlightRow = {
  markdown: string;
  iconKey: string | null;
  linkTarget: string | null;
};

/** Extract highlight rows from the highlights PML subtree. */
export function collectHighlightRows(node: unknown): HighlightRow[] {
  const results: HighlightRow[] = [];
  if (typeof node !== "object" || node === null) return results;

  const record = node as Record<string, unknown>;
  const children = record.children ?? record.child;

  // If this is a STACK with RICH_TEXT children (a highlight row)
  if (record.type === "STACK" && record.axis === "HORIZONTAL") {
    const rowChildren = Array.isArray(children) ? children : [];
    const richText = rowChildren.find(
      (c: unknown) => typeof c === "object" && c !== null && (c as PmlNode).type === "RICH_TEXT"
    ) as PmlNode | undefined;

    if (richText?.markdown && typeof richText.markdown === "string") {
      const icon = rowChildren.find(
        (c: unknown) => typeof c === "object" && c !== null && (c as PmlNode).type === "ICON"
      ) as PmlNode | undefined;

      results.push({
        markdown: richText.markdown as string,
        iconKey: (icon?.iconKey as string) ?? null,
        linkTarget: null,
      });
      return results;
    }
  }

  // If this is a TOUCHABLE wrapping a highlight row
  if (record.type === "TOUCHABLE") {
    const onPress = record.onPress as PmlNode | undefined;
    const target = onPress?.actionType === "OPEN" ? ((onPress.target as string) ?? null) : null;
    const innerRows = collectHighlightRows(record.child);
    for (const row of innerRows) {
      row.linkTarget = target;
    }
    return innerRows;
  }

  // Recurse into children
  if (Array.isArray(children)) {
    for (const child of children) {
      results.push(...collectHighlightRows(child));
    }
  } else if (typeof children === "object" && children !== null) {
    results.push(...collectHighlightRows(children));
  }

  // Also recurse into pml.component
  const pml = record.pml as PmlNode | undefined;
  if (pml?.component) {
    results.push(...collectHighlightRows(pml.component));
  }

  return results;
}

// ─── Label badges ────────────────────────────────────────────────────────────

/** A label extracted from the product-page-labels container. */
export type LabelData = {
  text: string;
  textColor: string;
  backgroundColor: string;
};

/** Extract label badges from a labels container node. */
export function collectLabels(node: unknown): LabelData[] {
  const results: LabelData[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectLabels(item));
    }
    return results;
  }

  const record = node as Record<string, unknown>;

  // A CONTAINER with backgroundColor wrapping RICH_TEXT is a label badge
  if (
    record.type === "CONTAINER" &&
    typeof record.backgroundColor === "string" &&
    typeof record.borderRadius === "number"
  ) {
    const markdowns = collectMarkdowns(record);
    if (markdowns.length > 0) {
      const textColors = collectPropertyValues(record, "textAttributes")
        .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
        .map((a) => a.color)
        .filter((c): c is string => typeof c === "string");

      results.push({
        text: stripColorTags(markdowns[0]),
        textColor: textColors[0] ?? "#333333",
        backgroundColor: record.backgroundColor as string,
      });
      return results;
    }
  }

  // Recurse
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      results.push(...collectLabels(value));
    }
  }
  return results;
}

// ─── Nutrition rows ──────────────────────────────────────────────────────────

/** A row in a structured nutrition table from the PML tree. */
export type NutritionRowData = {
  label: string;
  value: string | null;
  isCategory: boolean;
  backgroundColor: string | null;
};

/** Extract nutrition table rows from the Voedingswaarde accordion body. */
export function collectNutritionRows(node: unknown): NutritionRowData[] {
  const results: NutritionRowData[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectNutritionRows(item));
    }
    return results;
  }

  const record = node as Record<string, unknown>;

  // A horizontal STACK with SPACE_BETWEEN distribution is a nutrition row
  if (
    record.type === "STACK" &&
    record.axis === "HORIZONTAL" &&
    (record.distribution === "SPACE_BETWEEN" || record.distribution === "END")
  ) {
    const rowChildren = Array.isArray(record.children) ? record.children : [];
    const texts = rowChildren
      .filter(
        (c: unknown): c is PmlNode =>
          typeof c === "object" && c !== null && (c as PmlNode).type === "RICH_TEXT"
      )
      .map((c: PmlNode) => ({
        text: stripColorTags((c.markdown as string) ?? ""),
        textType: (c.textType as string) ?? "",
      }));

    if (texts.length > 0) {
      const label = texts[0].text;
      const value = texts.length > 1 ? texts[1].text : null;
      const isCategory = texts[0].textType === "HEADLINE2";
      const bg = typeof record.backgroundColor === "string" ? record.backgroundColor : null;

      results.push({ label, value, isCategory, backgroundColor: bg });
      return results;
    }
  }

  // Recurse into children
  const children = record.children ?? record.child;
  if (Array.isArray(children)) {
    for (const child of children) {
      results.push(...collectNutritionRows(child));
    }
  } else if (typeof children === "object" && children !== null) {
    results.push(...collectNutritionRows(children));
  }

  return results;
}

// ─── Allergen badges ─────────────────────────────────────────────────────────

/** Allergen heading pattern: "Bevat" or "Bevat mogelijk". */
const ALLERGEN_HEADING_PATTERN = /^bevat(\s+mogelijk)?$/i;

/** An allergen group: a heading ("Bevat"/"Bevat mogelijk") and its badges. */
export type AllergenGroup = {
  category: "confirmed" | "mayContain";
  badges: LabelData[];
};

/**
 * Walk the allergies PML subtree and extract allergen groups.
 * Allergen badges use the same CONTAINER+RICH_TEXT structure as product labels.
 */
export function collectAllergenGroups(node: unknown): AllergenGroup[] {
  const results: AllergenGroup[] = [];
  if (typeof node !== "object" || node === null) return results;

  const component = findPmlComponent(node);
  if (!component) return results;

  const record = component as Record<string, unknown>;
  const children = Array.isArray(record.children) ? record.children : [];
  let currentCategory: "confirmed" | "mayContain" = "confirmed";

  for (const child of children) {
    if (typeof child !== "object" || child === null) continue;
    const childRecord = child as Record<string, unknown>;

    if (childRecord.type === "RICH_TEXT" && typeof childRecord.markdown === "string") {
      const text = stripColorTags(childRecord.markdown as string).trim();
      if (ALLERGEN_HEADING_PATTERN.test(text)) {
        currentCategory = text.toLowerCase().includes("mogelijk") ? "mayContain" : "confirmed";
        continue;
      }
    }

    if (childRecord.type === "STACK" && childRecord.axis === "HORIZONTAL") {
      // Reuse collectLabels — allergen badges are structurally identical
      const badges = collectLabels(childRecord);
      if (badges.length > 0) {
        results.push({ category: currentCategory, badges });
      }
    }
  }

  return results;
}

/** Find the first pml.component node inside a PML wrapper. */
function findPmlComponent(node: unknown): unknown {
  if (typeof node !== "object" || node === null) return null;
  const record = node as Record<string, unknown>;

  const pml = record.pml as Record<string, unknown> | undefined;
  if (pml?.component) return pml.component;

  const children = record.children ?? record.child;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findPmlComponent(child);
      if (found) return found;
    }
  } else if (typeof children === "object" && children !== null) {
    return findPmlComponent(children);
  }
  return null;
}
