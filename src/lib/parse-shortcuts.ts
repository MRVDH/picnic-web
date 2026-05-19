// Parser that extracts ShortcutItem[] from the home_page_root
// FusionPage PML tree. Targets the "Snel naar" (quick-access) section.
import type { ShortcutItem } from "@/lib/category-types";
import { cleanMarkdown, collectPropertyValues, findNodeByIdSubstring } from "@/lib/pml-helpers";

const SHORTCUT_SECTION_ID = "campaign-category-shortcuts-section";
const BADGE_TEXT_SIZE = 12;
const TITLE_TEXT_SIZE = 16;

/**
 * Parse the raw home_page_root FusionPage into ShortcutItem[].
 *
 * Locates the "Snel naar" section within the campaign layout, then
 * extracts each list item's name, image ID, badge, and deep-link.
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

  const name = extractTitleText(touchable);
  if (!name) return null;

  const badge = extractBadgeText(touchable);

  return { id: imageId, name, imageId, deepLinkTarget, badge };
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
 * Extract the display title by collecting all RICH_TEXT nodes with
 * size=16 weight=MEDIUM and concatenating them (handles "Onze Versmarkt"
 * which is split across two RICH_TEXT nodes with icons between them).
 */
function extractTitleText(node: RecordNode): string | null {
  const parts: string[] = [];
  collectTitleParts(node, parts);
  const joined = parts.join(" ").trim();
  return joined || null;
}

function collectTitleParts(node: unknown, parts: string[]): void {
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
    if (attrs?.size === TITLE_TEXT_SIZE && attrs?.weight === "MEDIUM") {
      const md = record.markdown;
      if (typeof md === "string") {
        parts.push(cleanMarkdown(md));
      }
      return;
    }
  }

  for (const value of Object.values(record)) {
    collectTitleParts(value, parts);
  }
}

/**
 * Extract the optional badge text (e.g. "900+ producten") from a
 * RICH_TEXT node with size=12 nested inside a yellow background container.
 */
function extractBadgeText(node: RecordNode): string | null {
  const result = { text: null as string | null };
  findBadgeText(node, result);
  return result.text;
}

function findBadgeText(node: unknown, result: { text: string | null }): void {
  if (result.text !== null) return;
  if (typeof node !== "object" || node === null) return;

  if (Array.isArray(node)) {
    for (const item of node) {
      findBadgeText(item, result);
    }
    return;
  }

  const record = node as RecordNode;
  if (record.type === "RICH_TEXT") {
    const attrs = record.textAttributes as RecordNode | undefined;
    if (attrs?.size === BADGE_TEXT_SIZE) {
      const md = record.markdown;
      if (typeof md === "string") {
        result.text = cleanMarkdown(md);
        return;
      }
    }
  }

  for (const value of Object.values(record)) {
    findBadgeText(value, result);
  }
}
