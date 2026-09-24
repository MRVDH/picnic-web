// Parsers for the app's Pakketservice pages: parcels-overview-page-root (the
// list) and parcel-tracking-page-root (one parcel). All texts (titles,
// statuses, dates) come localized from Picnic, so the pages only need a
// layout on our side.
import type {
  ParcelDetailData,
  ParcelRow,
  ParcelSection,
  ParcelTrackingStep,
  ParcelsPageData,
} from "@/lib/core/delivery-types";
import {
  type PmlNode,
  cleanMarkdown,
  collectMarkdowns,
  extractInnerColor,
  findNodeById,
} from "@/lib/pml/pml-helpers";

const LIST_HEADER_ID = "parcels-history-header";
/** Section headings are "parcel-item-header-<n>", rows "parcel-item-<n>-<i>". */
const SECTION_HEADER_PATTERN = /^parcel-item-header-\d+$/;
const PARCEL_ROW_PATTERN = /^parcel-item-\d+-\d+$/;
const PARCEL_ID_PATTERN = /[;,]parcel_id=([^,;&]+)/;
const ROW_TITLE_SIZE = 16;

const DETAIL_HEADER_ID = "parcels-tracker-header";
const DETAIL_TRACKER_ID = "parcel-tracker-view";
const DETAIL_FOOTER_ID = "parcels-tracker-footer";
const DETAIL_TITLE_SIZE = 28;
const STEP_TITLE_SIZE = 16;
const STEP_DATE_SIZE = 14;
const DEFAULT_MARKER_SIZE = 20;

/** Parse the raw parcels-overview-page-root Fusion page. */
export function parseParcelsPage(rawPage: unknown): ParcelsPageData {
  const [title = "", subtitle = ""] = collectMarkdowns(findNodeById(rawPage, LIST_HEADER_ID)).map(
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

  return { title, subtitle, sections };
}

/**
 * Parse the raw parcel-tracking-page-root Fusion page. The tracker is a
 * vertical stack of steps; each step has a marker column (a colored circle,
 * with a checkmark when done, and a line to the next step) and a text column
 * (title and date).
 */
export function parseParcelDetailPage(rawPage: unknown): ParcelDetailData {
  const header = findNodeById(rawPage, DETAIL_HEADER_ID);
  const headerTexts = collectRichTexts(header);
  const title = headerTexts.find((t) => t.size === DETAIL_TITLE_SIZE)?.markdown ?? "";
  const copy = findCopyAction(header);
  const shipmentTexts = headerTexts.filter((t) => t.size !== DETAIL_TITLE_SIZE);
  const shipmentLabel = shipmentTexts[0]?.markdown ?? "";
  const shipmentNumber = copy?.text ?? shipmentTexts[1]?.markdown ?? "";

  const tracker = findNodeById(rawPage, DETAIL_TRACKER_ID);
  const steps = findStepStacks(tracker).flatMap((stack) => {
    const step = extractTrackingStep(stack);
    return step ? [step] : [];
  });

  const footerText = collectMarkdowns(findNodeById(rawPage, DETAIL_FOOTER_ID))[0] ?? "";

  return {
    title: cleanMarkdown(title),
    shipmentLabel: cleanMarkdown(shipmentLabel),
    shipmentNumber: cleanMarkdown(shipmentNumber),
    copiedMessage: copy?.message ?? null,
    steps,
    footerText: cleanMarkdown(footerText),
  };
}

// ─── List helpers ────────────────────────────────────────────────────────────

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
  const name = texts.find((t) => t.size === ROW_TITLE_SIZE)?.markdown;
  if (!name) return null;

  const statusLine = texts.filter((t) => t.size !== ROW_TITLE_SIZE).map((t) => t.markdown);
  const [status = "", , date = ""] = statusLine;
  const deepLink = findTarget(node);

  return {
    id,
    name: cleanMarkdown(name),
    statusText: cleanMarkdown(status),
    statusColor: extractInnerColor(status),
    dateText: cleanMarkdown(date),
    parcelId: deepLink ? (PARCEL_ID_PATTERN.exec(deepLink)?.[1] ?? null) : null,
  };
}

// ─── Detail helpers ──────────────────────────────────────────────────────────

/** The steps: horizontal stacks whose first child is the marker column. */
function findStepStacks(node: unknown, out: PmlNode[] = []): PmlNode[] {
  if (typeof node !== "object" || node === null) return out;
  if (Array.isArray(node)) {
    for (const item of node) findStepStacks(item, out);
    return out;
  }
  const record = node as PmlNode;
  const children = Array.isArray(record.children) ? (record.children as PmlNode[]) : [];
  if (record.type === "STACK" && record.axis === "HORIZONTAL" && children.length === 2) {
    const texts = collectRichTexts(children[1]);
    if (texts.some((t) => t.size === STEP_TITLE_SIZE)) {
      out.push(record);
      return out;
    }
  }
  for (const value of Object.values(record)) findStepStacks(value, out);
  return out;
}

function extractTrackingStep(stack: PmlNode): ParcelTrackingStep | null {
  const [markerColumn, textColumn] = stack.children as PmlNode[];
  const texts = collectRichTexts(textColumn);
  const title = texts.find((t) => t.size === STEP_TITLE_SIZE)?.markdown;
  if (!title) return null;

  // Marker column: a CONTAINER circle (with an ICON when done), optionally followed by the line.
  const parts = Array.isArray(markerColumn?.children) ? (markerColumn.children as PmlNode[]) : [];
  const marker = parts[0];
  const line = parts[1];
  const markerSize = typeof marker?.height === "number" ? marker.height : DEFAULT_MARKER_SIZE;

  return {
    title: cleanMarkdown(title),
    dateText: cleanMarkdown(texts.find((t) => t.size === STEP_DATE_SIZE)?.markdown ?? ""),
    done: (marker?.child as PmlNode | undefined)?.iconKey === "checkmark",
    markerColor: readString(marker?.backgroundColor),
    markerSize,
    lineColor: readString(line?.backgroundColor),
  };
}

/** The shipment number's COPY action: the text it copies and the toast shown after. */
function findCopyAction(node: unknown): { text: string; message: string | null } | null {
  if (typeof node !== "object" || node === null) return null;
  const record = node as PmlNode;
  const onPress = record.onPress as PmlNode | undefined;
  if (onPress?.actionType === "COPY" && typeof onPress.text === "string") {
    const next = (onPress.onNext as PmlNode | undefined)?.action as PmlNode | undefined;
    return { text: onPress.text, message: readString(next?.message) };
  }
  for (const value of Object.values(record)) {
    const found = findCopyAction(value);
    if (found) return found;
  }
  return null;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

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

function readString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
