/**
 * Maps PML color tokens to CSS color values.
 * The Picnic PML spec uses hex colors directly, so most pass through.
 */
export function pmlColor(color?: string | null): string | undefined {
  if (!color) return undefined;
  return color;
}

/**
 * Converts PML padding to CSS padding string.
 */
export function pmlPadding(padding?: { top?: number; right?: number; bottom?: number; left?: number } | null): string | undefined {
  if (!padding) return undefined;
  const t = padding.top ?? 0;
  const r = padding.right ?? 0;
  const b = padding.bottom ?? 0;
  const l = padding.left ?? 0;
  return `${t}px ${r}px ${b}px ${l}px`;
}

/**
 * Converts PML size expressions to CSS values.
 * Handles percentages, numbers, grid units, and SCREEN_WIDTH expressions.
 */
export function pmlSize(value?: string | number | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string") {
    if (value.endsWith("%")) return value;
    if (/^\d+$/.test(value)) return `${value}px`;
    if (/^\d+(\.\d+)?$/.test(value)) return `${value}px`;

    // 12g = 12-grid = full width
    if (value === "12g") return "100%";

    // Grid units (e.g. "6g" = 50%)
    const gridMatch = value.match(/^(\d+)g$/);
    if (gridMatch) return `${(parseInt(gridMatch[1]) / 12) * 100}%`;

    // SCREEN_HEIGHT → 100vh
    if (value === "SCREEN_HEIGHT") return "100vh";

    // CONTAINER_HEIGHT → auto (let content determine)
    if (value === "CONTAINER_HEIGHT") return "auto";

    // SCREEN_WIDTH alone → 100%
    if (value === "SCREEN_WIDTH") return "100%";

    // SCREEN_WIDTH expressions → CSS calc()
    // Replace SCREEN_WIDTH with the container width variable
    if (value.includes("SCREEN_WIDTH")) {
      const calcExpr = value.replace(/SCREEN_WIDTH/g, "var(--content-width, 100vw)");
      return `calc(${calcExpr})`;
    }

    return value;
  }
  return undefined;
}

/**
 * Maps PML font weight names to CSS font-weight numbers.
 */
export function pmlFontWeight(weight?: string): number | undefined {
  if (!weight) return undefined;
  const map: Record<string, number> = {
    THIN: 100,
    EXTRA_LIGHT: 200,
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    SEMI_BOLD: 600,
    BOLD: 700,
    EXTRA_BOLD: 800,
    BLACK: 900,
  };
  return map[weight] ?? 400;
}

/**
 * Maps PML text types to a CSS font-size.
 */
export function pmlTextSize(size?: number | null, textType?: string | null): number {
  if (size) return size;
  if (!textType) return 14;
  const map: Record<string, number> = {
    TITLE: 24,
    SUBTITLE: 18,
    BODY: 14,
    CAPTION: 12,
    FOOTNOTE: 10,
  };
  return map[textType] ?? 14;
}
