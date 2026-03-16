/**
 * Maps PML color tokens to CSS color values.
 * Handles hex colors (passthrough), named Picnic tokens (RED1, GREY1, etc.),
 * and EXPRESSION objects (resolves to the default/else branch color).
 */
export function pmlColor(color?: string | Record<string, any> | null): string | undefined {
  if (!color) return undefined;

  // Handle EXPRESSION objects — extract the default (else-branch) color
  if (typeof color === "object" && (color as any).type === "EXPRESSION") {
    const expr: string = (color as any).expression ?? "";
    // Pattern: condition ? 'COLOR_A' : 'COLOR_B' — take COLOR_B (default)
    const elseMatch = expr.match(/:\s*'([^']+)'\s*$/);
    if (elseMatch) return resolveColorToken(elseMatch[1]);
    // Fallback: try first quoted value
    const anyMatch = expr.match(/'([^']+)'/);
    if (anyMatch) return resolveColorToken(anyMatch[1]);
    return undefined;
  }

  if (typeof color !== "string") return undefined;
  return resolveColorToken(color);
}

const PICNIC_COLORS: Record<string, string> = {
  BLACK: "#000000",
  BLUE1: "#1977d5",
  BLUE2: "#3d589d",
  GREEN1: "#4b8505",
  GREEN2: "#a1c826",
  GREEN3: "#709489",
  GREEN4: "#6b7a3b",
  GREEN5: "#f3f6e9",
  GREY0: "#fcfaf9",
  GREY1: "#f8f5f2",
  GREY2: "#c9c6c3",
  GREY3: "#787570",
  GREY4: "#5b534e",
  GREY5: "#333333",
  ORANGE1: "#ce4a00",
  RED1: "#e1171e",
  RED2: "#b40117",
  WHITE: "#ffffff",
  YELLOW1: "#f5a60c",
  YELLOW2: "#fbd92b",
};

function resolveColorToken(color: string): string {
  return PICNIC_COLORS[color] || color;
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
    HEADER1: 28,
    HEADER2: 24,
    HEADER3: 20,
    HEADER4: 18,
    HEADER5: 16,
    HEADER6: 14,
    BODY: 14,
    CAPTION: 12,
    FOOTNOTE: 10,
  };
  return map[textType] ?? 14;
}

/**
 * Returns a default font weight for a given text type, if the text attributes
 * don't specify one. Header types default to bold.
 */
export function pmlDefaultFontWeight(textType?: string | null): number | undefined {
  if (!textType) return undefined;
  if (textType.startsWith("HEADER") || textType === "TITLE") return 700;
  if (textType === "SUBTITLE") return 600;
  return undefined;
}
