// Parser for parcels-overview-page-root, the app's Pakketservice page.
// All texts (title, section headings, statuses, dates) come localized from
// Picnic, so the page only needs a layout on our side.
import type { ParcelRow, ParcelSection, ParcelsPageData } from "@/lib/core/delivery-types";
import {
  type PmlNode,
  cleanMarkdown,
  collectMarkdowns,
  extractInnerColor,
  findNodeById,
} from "@/lib/pml/pml-helpers";

const HEADER_ID = "parcels-history-header";
const ACTION_BUTTON_ID = "parcel-action-button";
/** Section headings are "parcel-item-header-<n>", rows "parcel-item-<n>-<i>". */
const SECTION_HEADER_PATTERN = /^parcel-item-header-\d+$/;
const PARCEL_ROW_PATTERN = /^parcel-item-\d+-\d+$/;
const TITLE_TEXT_SIZE = 16;

/** Parse the raw parcels-overview-page-root Fusion page. */
export function parseParcelsPage(rawPage: unknown): ParcelsPageData {
  const [title = "", subtitle = ""] = collectMarkdowns(findNodeById(rawPage, HEADER_ID)).map(
    cleanMarkdown
  );

  const sections: ParcelSection[] = [];
  for (const node of collectPmlItems(rawPage)) {
    const id = String(node.id);
    if (SECTION_HEADER_PATTERN.test(id)) {
      sections.push({ title: cleanMarkdown(collectMarkdowns(node)[0] ?? ""), parcels: [] });
    } else if (PARCEL_ROW_PATTERN.test(id)) {
      const row = extractParcelRow(node, id);
      if (!row) continue;
      // Rows before any heading still get a (headless) section.
      if (sections.length === 0) sections.push({ title: "", parcels: [] });
      sections[sections.length - 1].parcels.push(row);
    }
  }

  return {
    title,
    subtitle,
    sections,
    action: extractAction(findNodeById(rawPage, ACTION_BUTTON_ID)),
  };
}

/** Every PML node with a string id, in document order. */
function collectPmlItems(node: unknown, out: PmlNode[] = []): PmlNode[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectPmlItems(item, out);
    return out;
  }
  const record = node as PmlNode;
  if (record.type === "PML" && typeof record.id === "string") {
    out.push(record);
    return out;
  }
  for (const value of Object.values(record)) collectPmlItems(value, out);
  return out;
}

/**
 * A row is a TOUCHABLE with the name (size 16) and a status line made of
 * three RICH_TEXTs: the colored status, a separator and the date.
 */
function extractParcelRow(node: PmlNode, id: string): ParcelRow | null {
  const texts = collectRichTexts(node);
  const name = texts.find((t) => t.size === TITLE_TEXT_SIZE)?.markdown;
  if (!name) return null;

  const statusLine = texts.filter((t) => t.size !== TITLE_TEXT_SIZE).map((t) => t.markdown);
  const [status = "", , date = ""] = statusLine;

  return {
    id,
    name: cleanMarkdown(name),
    statusText: cleanMarkdown(status),
    statusColor: extractInnerColor(status),
    dateText: cleanMarkdown(date),
    deepLink: findTarget(node),
  };
}

function extractAction(node: PmlNode | null): ParcelsPageData["action"] {
  if (!node) return null;
  const label = collectMarkdowns(node)[0];
  return label ? { label: cleanMarkdown(label), deepLink: findTarget(node) } : null;
}

type RichText = { markdown: string; size: number | null };

/** RICH_TEXT nodes with their own markdown, in document order. */
function collectRichTexts(node: unknown, out: RichText[] = []): RichText[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectRichTexts(item, out);
    return out;
  }
  const record = node as PmlNode;
  if (record.type === "RICH_TEXT" && typeof record.markdown === "string") {
    const size = (record.textAttributes as { size?: unknown } | undefined)?.size;
    out.push({ markdown: record.markdown, size: typeof size === "number" ? size : null });
  }
  for (const value of Object.values(record)) collectRichTexts(value, out);
  return out;
}

/** The first onPress.target in the subtree. */
function findTarget(node: unknown): string | null {
  if (typeof node !== "object" || node === null) return null;
  const record = node as PmlNode;
  const onPress = record.onPress as { target?: unknown } | undefined;
  if (typeof onPress?.target === "string") return onPress.target;
  for (const value of Object.values(record)) {
    const target = findTarget(value);
    if (target) return target;
  }
  return null;
}
