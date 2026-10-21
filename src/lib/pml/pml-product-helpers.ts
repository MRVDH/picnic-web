// PML traversal helper for the label badges on Fusion product cards.
import { collectMarkdowns, collectPropertyValues, stripColorTags } from "@/lib/pml/pml-helpers";

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
