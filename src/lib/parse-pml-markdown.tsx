/** A parsed markdown token: text with optional bold and color. */
export type MarkdownToken = {
  text: string;
  bold: boolean;
  color: string | null;
};

/** Default text colors that should not be treated as colored highlights. */
const DEFAULT_TEXT_COLORS = new Set(["#333333", "#5b534e", "#787570"]);

/** Bold regex: matches **content** or __content__ (content may contain color tags). */
const BOLD_REGEX = /(\*\*(?:(?!\*\*).)+\*\*|__(?:(?!__).)+__)/g;

/** Color tag regex: matches #(#hex)text#(#hex) pairs (non-greedy, same color). */
const COLOR_TAG_REGEX = /#\(([^)]+)\)(.*?)#\(\1\)/g;

/** Strip nested bold markers from text (e.g. **text** -> text). */
function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, "").replace(/__/g, "").trim();
}

/** Strip orphaned color tags from a text fragment. */
function stripOrphanedColorTags(text: string): string {
  return text.replace(/#\([^)]+\)/g, "");
}

/**
 * Parse PML markdown into tokens with bold/color information.
 *
 * Handles all combinations: **bold**, #(#color)text#(#color),
 * **#(#color)text#(#color)**, #(#color)**bold**#(#color),
 * __**nested**__, and nested color wrappers.
 */
export function parseMarkdownTokens(markdown: string): MarkdownToken[] {
  const boldParts = splitBoldParts(markdown);

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
export function renderPmlMarkdown(markdown: string): React.ReactNode {
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
