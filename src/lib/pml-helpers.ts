// PML tree traversal helpers and markdown utilities for parsing
// Picnic Fusion page responses.

// ─── Types for the raw Fusion page structure ─────────────────────────────────

export type PmlNode = Record<string, unknown>;

export type AnalyticsContext = {
  data: Record<string, unknown>;
  schema: string;
};

export type SellingUnitTileContainer = {
  type: "PML";
  id: string;
  analytics?: { contexts?: AnalyticsContext[] };
  content?: {
    type: string;
    sellingUnit?: RawSellingUnit;
  };
  pml?: { component?: PmlNode };
};

export type RawSellingUnit = {
  id: string;
  name: string;
  image_id: string;
  display_price: number;
  unit_quantity: string;
  max_count: number;
  decorators: unknown[];
  price_ranges: unknown[] | null;
};

// ─── PML markdown helpers ────────────────────────────────────────────────────

/** Strip Picnic markdown color tags: #(#aabbcc)text#(#aabbcc) → text */
export function stripColorTags(md: string): string {
  return md.replace(/#\([^)]+\)/g, "").trim();
}

/**
 * Strip both color tags and bold markers, returning clean text.
 * e.g. "#(#628003)**Bio**#(#628003) trostomaten" → "Bio trostomaten"
 */
export function cleanMarkdown(md: string): string {
  return stripColorTags(md).replace(/\*\*/g, "").replace(/__/g, "").trim();
}

/**
 * Extract the innermost color tag value from markdown.
 * e.g. "#(#333333)#(#B40117)Prijskampioen#(#B40117)#(#333333)" → "#B40117"
 * Returns the color closest to the text content, or null if no distinct
 * non-default color is found.
 */
export function extractInnerColor(md: string): string | null {
  const colorRegex = /#\(([^)]+)\)/g;
  const colors: string[] = [];
  let match;
  while ((match = colorRegex.exec(md)) !== null) {
    colors.push(match[1]);
  }
  if (colors.length === 0) return null;

  // Default text colors that don't count as "highlights"
  const DEFAULT_COLORS = new Set(["#333333", "#5b534e", "#787570"]);

  // Find the innermost non-default color (closest to the text)
  for (const color of colors) {
    if (!DEFAULT_COLORS.has(color.toLowerCase())) {
      return color;
    }
  }
  return null;
}

// ─── Recursive finders ───────────────────────────────────────────────────────

/** Find all selling-unit tile containers in the Fusion page tree. */
export function findSellingUnitContainers(
  obj: unknown,
): SellingUnitTileContainer[] {
  const results: SellingUnitTileContainer[] = [];

  if (typeof obj !== "object" || obj === null) return results;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...findSellingUnitContainers(item));
    }
    return results;
  }

  const record = obj as Record<string, unknown>;

  if (
    record.type === "PML" &&
    typeof record.id === "string" &&
    record.id.startsWith("selling-unit-") &&
    record.id.includes("-tile")
  ) {
    results.push(record as unknown as SellingUnitTileContainer);
  }

  for (const value of Object.values(record)) {
    results.push(...findSellingUnitContainers(value));
  }

  return results;
}

/** Collect all markdown strings from a PML subtree. */
export function collectMarkdowns(node: unknown): string[] {
  const results: string[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectMarkdowns(item));
    }
    return results;
  }

  const record = node as Record<string, unknown>;
  if (typeof record.markdown === "string") {
    results.push(record.markdown);
  }
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      results.push(...collectMarkdowns(value));
    }
  }
  return results;
}

/** Find all ICON nodes in a PML subtree. */
export function findIconNodes(
  node: unknown,
): { iconKey: string; fallbackId: string | null }[] {
  const results: { iconKey: string; fallbackId: string | null }[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...findIconNodes(item));
    }
    return results;
  }

  const record = node as Record<string, unknown>;
  if (
    record.type === "ICON" &&
    typeof record.iconKey === "string"
  ) {
    const fallback = record.fallback as { id?: string } | undefined;
    results.push({
      iconKey: record.iconKey as string,
      fallbackId: fallback?.id ?? null,
    });
  }
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      results.push(...findIconNodes(value));
    }
  }
  return results;
}
