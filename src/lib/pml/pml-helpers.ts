// PML tree traversal helpers and markdown utilities for parsing
// Picnic Fusion page responses.

// ─── Types for the raw Fusion page structure ─────────────────────────────────

export type PmlNode = Record<string, unknown>;

export type AnalyticsContext = {
  data: Record<string, unknown>;
  schema: string;
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

/**
 * Find the first node with an exact `id` match.
 * Traverses `child`, `children`, and all object values recursively.
 */
export function findNodeById(obj: unknown, id: string): PmlNode | null {
  if (typeof obj !== "object" || obj === null) return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findNodeById(item, id);
      if (result) return result;
    }
    return null;
  }

  const record = obj as PmlNode;
  if (record.id === id) return record;

  for (const value of Object.values(record)) {
    const result = findNodeById(value, id);
    if (result) return result;
  }
  return null;
}

/**
 * Recursively collect all values for a given property name.
 * Replaces JSONPath `$..key` pattern without adding a dependency.
 */
export function collectPropertyValues(node: unknown, key: string): unknown[] {
  const results: unknown[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectPropertyValues(item, key));
    }
    return results;
  }

  const record = node as Record<string, unknown>;
  if (key in record) {
    results.push(record[key]);
  }
  for (const [k, value] of Object.entries(record)) {
    if (k !== key && typeof value === "object" && value !== null) {
      results.push(...collectPropertyValues(value, key));
    }
  }
  return results;
}
