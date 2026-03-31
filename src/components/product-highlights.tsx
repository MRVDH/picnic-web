import type { ProductHighlightItem } from "@/lib/types";

type ProductHighlightsProps = {
  highlights: ProductHighlightItem[];
};

/** Map known PML icon keys to simple emoji/unicode fallbacks. */
const ICON_MAP: Record<string, string> = {
  starsOutlined: "\u2728",
  pin: "\uD83D\uDCCC",
  snowflake: "\u2744\uFE0F",
  clock: "\uD83D\uDD52",
  leaf: "\uD83C\uDF3F",
  leafOutlined: "\uD83C\uDF3F",
  freshLeaf: "\uD83C\uDF3F",
  qualityLeaf: "\uD83C\uDF3F",
  heart: "\u2764\uFE0F",
  fire: "\uD83D\uDD25",
  check: "\u2705",
  checkCircle: "\u2705",
  checkCircleOutlined: "\u2705",
  checkOutlined: "\u2705",
  verified: "\u2705",
  star: "\u2B50",
  info: "\u2139\uFE0F",
  infoCircle: "\u2139\uFE0F",
  trophy: "\uD83C\uDFC6",
  crown: "\uD83D\uDC51",
  priceTag: "\uD83C\uDFF7\uFE0F",
  tag: "\uD83C\uDFF7\uFE0F",
  shieldCheck: "\uD83D\uDEE1\uFE0F",
  calendar: "\uD83D\uDCC5",
  apple: "\uD83C\uDF4E",
  whisk: "\uD83C\uDF75",
  list: "\uD83D\uDCCB",
  shareIcon: "\uD83D\uDD17",
};

/** Fallback icon for unknown icon keys. */
const FALLBACK_ICON = "\u25CF";

/** Strip nested bold markers from text (e.g. **text** -> text). */
function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, "").replace(/__/g, "").trim();
}

/** Default text colors that should not be treated as colored highlights. */
const DEFAULT_TEXT_COLORS = new Set(["#333333", "#5b534e", "#787570"]);

/** Bold regex: matches **content** or __content__ (content may contain color tags). */
const BOLD_REGEX = /(\*\*(?:(?!\*\*).)+\*\*|__(?:(?!__).)+__)/g;

/** Color tag regex: matches #(#hex)text#(#hex) pairs (non-greedy, same color). */
const COLOR_TAG_REGEX = /#\(([^)]+)\)(.*?)#\(\1\)/g;

/** Strip orphaned color tags from a text fragment. */
function stripOrphanedColorTags(text: string): string {
  return text.replace(/#\([^)]+\)/g, "");
}

/** A parsed markdown token: text with optional bold and color. */
type MarkdownToken = {
  text: string;
  bold: boolean;
  color: string | null;
};

/**
 * Parse PML markdown into tokens with bold/color information.
 *
 * Handles all combinations: **bold**, #(#color)text#(#color),
 * **#(#color)text#(#color)**, #(#color)**bold**#(#color),
 * __**nested**__, and nested color wrappers.
 */
function parseMarkdownTokens(markdown: string): MarkdownToken[] {
  // Step 1: split into bold vs non-bold parts
  const boldParts = splitBoldParts(markdown);

  // Step 2: within each part, extract color segments
  const tokens: MarkdownToken[] = [];
  for (const part of boldParts) {
    const colorSegments = extractColorSegments(part.text);
    for (const seg of colorSegments) {
      tokens.push({ text: seg.text, bold: part.bold, color: seg.color });
    }
  }
  return tokens;
}

/** Split markdown into bold and non-bold parts. */
function splitBoldParts(
  markdown: string,
): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = new RegExp(BOLD_REGEX.source, "g");
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: markdown.slice(lastIndex, match.index), bold: false });
    }
    const inner = match[1];
    const content = stripBoldMarkers(inner.slice(2, -2));
    parts.push({ text: content, bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    parts.push({ text: markdown.slice(lastIndex), bold: false });
  }
  return parts;
}

/** Extract color-tagged regions from text, handling nesting. */
function extractColorSegments(
  text: string,
): { text: string; color: string | null }[] {
  const segments: { text: string; color: string | null }[] = [];
  const regex = new RegExp(COLOR_TAG_REGEX.source, "g");
  let lastIndex = 0;
  let colorMatch;

  while ((colorMatch = regex.exec(text)) !== null) {
    if (colorMatch.index > lastIndex) {
      segments.push({
        text: stripOrphanedColorTags(text.slice(lastIndex, colorMatch.index)),
        color: null,
      });
    }
    const color = colorMatch[1];
    const innerText = colorMatch[2];
    const isDefault = DEFAULT_TEXT_COLORS.has(color.toLowerCase());

    // Recursively handle nested color tags
    const innerSegments = extractColorSegments(innerText);
    const hasNestedColors = innerSegments.some((s) => s.color !== null);

    if (!hasNestedColors) {
      segments.push({ text: innerText, color: isDefault ? null : color });
    } else {
      for (const inner of innerSegments) {
        segments.push({
          text: inner.text,
          color: inner.color ?? (isDefault ? null : color),
        });
      }
    }
    lastIndex = colorMatch.index + colorMatch[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: stripOrphanedColorTags(text.slice(lastIndex)),
      color: null,
    });
  }

  return segments.filter((s) => s.text !== "");
}

/** Render markdown text with bold and inline color support. */
function renderMarkdownText(markdown: string): React.ReactNode {
  const tokens = parseMarkdownTokens(markdown);

  return tokens.map((token, index) => {
    const key = `md-${index}`;

    if (token.bold && token.color) {
      return (
        <strong key={key} className="font-semibold" style={{ color: token.color }}>
          {token.text}
        </strong>
      );
    }
    if (token.bold) {
      return (
        <strong key={key} className="font-semibold">
          {token.text}
        </strong>
      );
    }
    if (token.color) {
      return (
        <span key={key} style={{ color: token.color }}>
          {token.text}
        </span>
      );
    }
    return token.text;
  });
}

export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="divide-y divide-gray-100">
      {highlights.map((item, index) => {
        const icon = item.iconKey
          ? (ICON_MAP[item.iconKey] ?? FALLBACK_ICON)
          : null;

        const content = (
          <div className="flex items-center gap-3 py-3">
            {icon && (
              <span className="shrink-0 text-base" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="text-sm text-foreground">
              {renderMarkdownText(item.text)}
            </span>
          </div>
        );

        // If this highlight has a link target, we can't use it as a web URL
        // (it's a deep link like nl.picnic-supermarkt://...), so just show it
        // as styled text
        if (item.linkTarget) {
          return (
            <div
              key={`highlight-${index}`}
              className="cursor-default text-gray-600"
            >
              {content}
            </div>
          );
        }

        return (
          <div key={`highlight-${index}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
