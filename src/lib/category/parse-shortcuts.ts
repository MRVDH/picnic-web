// Parser that extracts ShortcutItem[] from the category-tree-root
// FusionPage PML tree: the shortcut rows the app shows at the top of the
// search tab ("Alle acties", "Nieuw", ...).
import type { ShortcutBadge, ShortcutItem, ShortcutTitlePart } from "@/lib/category/category-types";
import {
  cleanMarkdown,
  collectPropertyValues,
  extractInnerColor,
  findNodeByIdSubstring,
} from "@/lib/pml/pml-helpers";
import { PML_ICON_SOURCES } from "@/lib/pml/pml-icons";

const SHORTCUT_SECTION_ID = "search-recommendations-list-section";
const BADGE_TEXT_SIZE = 12;
const TITLE_TEXT_SIZE = 16;
const DEFAULT_TITLE_COLOR = "#333333";

/**
 * Parse the raw category-tree-root FusionPage into ShortcutItem[].
 *
 * Locates the shortcuts section above the category list, then extracts
 * each list item's name, image ID, badge, and deep-link.
 */
export function parseShortcutsPage(rawPage: unknown): ShortcutItem[] {
  const section = findNodeByIdSubstring(rawPage, SHORTCUT_SECTION_ID);
  if (!section) return [];

  const touchables = collectTouchables(section);
  const shortcuts: ShortcutItem[] = [];

  for (const touchable of touchables) {
    const item = extractShortcutFromTouchable(touchable);
    if (item) shortcuts.push(item);
  }

  return shortcuts;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

type RecordNode = Record<string, unknown>;

/** Recursively collect all TOUCHABLE nodes in a subtree. */
function collectTouchables(node: unknown): RecordNode[] {
  const results: RecordNode[] = [];
  if (typeof node !== "object" || node === null) return results;

  if (Array.isArray(node)) {
    for (const item of node) {
      results.push(...collectTouchables(item));
    }
    return results;
  }

  const record = node as RecordNode;
  if (record.type === "TOUCHABLE") {
    results.push(record);
    return results;
  }

  for (const value of Object.values(record)) {
    results.push(...collectTouchables(value));
  }
  return results;
}

/** Extract a ShortcutItem from a single TOUCHABLE PML node. */
function extractShortcutFromTouchable(touchable: RecordNode): ShortcutItem | null {
  const deepLinkTarget = extractDeepLinkTarget(touchable);
  if (!deepLinkTarget) return null;

  const imageId = findFirstImageId(touchable);
  if (!imageId) return null;

  const titleParts: ShortcutTitlePart[] = [];
  collectTitleParts(touchable, titleParts);
  const name = titleParts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .trim();
  if (!name) return null;

  const badge = extractBadge(touchable);

  return { id: imageId, name, titleParts, imageId, deepLinkTarget, badge };
}

/** Extract the onPress.target deep-link string. */
function extractDeepLinkTarget(node: RecordNode): string | null {
  const onPress = node.onPress;
  if (typeof onPress !== "object" || onPress === null) return null;
  const target = (onPress as RecordNode).target;
  return typeof target === "string" ? target : null;
}

/** Find the first IMAGE source.id in the subtree. */
function findFirstImageId(node: RecordNode): string | null {
  const sources = collectPropertyValues(node, "source");
  for (const source of sources) {
    if (typeof source !== "object" || source === null) continue;
    const sourceId = (source as RecordNode).id;
    if (typeof sourceId === "string" && sourceId !== "") return sourceId;
  }
  return null;
}

/**
 * Collect the title pieces in display order: RICH_TEXT nodes with size=16
 * weight=MEDIUM, plus ICON nodes we have an asset for (the laurel leaves
 * around "Versmarkt"). Other icons, like the row chevron, are skipped.
 */
function collectTitleParts(node: unknown, parts: ShortcutTitlePart[]): void {
  if (typeof node !== "object" || node === null) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      collectTitleParts(item, parts);
    }
    return;
  }

  const record = node as RecordNode;
  if (record.type === "RICH_TEXT") {
    const attrs = record.textAttributes as RecordNode | undefined;
    const md = record.markdown;
    if (attrs?.size === TITLE_TEXT_SIZE && attrs?.weight === "MEDIUM" && typeof md === "string") {
      const color = typeof attrs.color === "string" ? attrs.color : null;
      parts.push({
        type: "text",
        text: cleanMarkdown(md),
        color: color && color.toLowerCase() !== DEFAULT_TITLE_COLOR ? color : null,
      });
      return;
    }
  }

  if (record.type === "ICON" && typeof record.iconKey === "string") {
    if (record.iconKey in PML_ICON_SOURCES) {
      parts.push({
        type: "icon",
        iconKey: record.iconKey,
        color: typeof record.color === "string" ? record.color : null,
        width: typeof record.width === "number" ? record.width : TITLE_TEXT_SIZE,
        height: typeof record.height === "number" ? record.height : TITLE_TEXT_SIZE,
      });
    }
    return;
  }

  for (const value of Object.values(record)) {
    collectTitleParts(value, parts);
  }
}

/**
 * Extract the optional badge (e.g. "1300+ producten"): a RICH_TEXT node
 * with size=12 inside a colored CONTAINER. The text color comes from the
 * markdown color tag, falling back to the text attributes.
 */
function extractBadge(node: RecordNode): ShortcutBadge | null {
  const result = { badge: null as ShortcutBadge | null };
  findBadge(node, null, result);
  return result.badge;
}

function findBadge(
  node: unknown,
  parentBackground: string | null,
  result: { badge: ShortcutBadge | null }
): void {
  if (result.badge !== null) return;
  if (typeof node !== "object" || node === null) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      findBadge(item, parentBackground, result);
    }
    return;
  }

  const record = node as RecordNode;
  if (record.type === "RICH_TEXT") {
    const attrs = record.textAttributes as RecordNode | undefined;
    const md = record.markdown;
    if (attrs?.size === BADGE_TEXT_SIZE && typeof md === "string") {
      const attrColor = typeof attrs.color === "string" ? attrs.color : null;
      result.badge = {
        text: cleanMarkdown(md),
        backgroundColor: parentBackground,
        textColor: extractInnerColor(md) ?? attrColor,
      };
      return;
    }
  }

  const background =
    record.type === "CONTAINER" && typeof record.backgroundColor === "string"
      ? record.backgroundColor
      : parentBackground;

  for (const value of Object.values(record)) {
    findBadge(value, background, result);
  }
}
