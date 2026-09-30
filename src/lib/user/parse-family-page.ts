// Parser for the app's Mijn Family-account page (my-family-account): what
// the membership saved, its benefits and the current plan. All texts come
// localized from Picnic. The page has no node ids here, so sections are found
// by the buttons they contain.
import type { FamilyInfoGroup, FamilyPageData, FamilyText } from "@/lib/core/user-types";
import { type PmlNode, cleanMarkdown } from "@/lib/pml/pml-helpers";

/** Picnic's font weight names as CSS weights. */
const FONT_WEIGHTS: Record<string, number> = {
  REGULAR: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
};

/** The "Jouw besparing" button opens this bottom sheet. */
const SAVINGS_SHEET_PAGE = "my-family-savings-bottom-sheet";

/** Parse the raw my-family-account Fusion page. */
export function parseFamilyPage(rawPage: unknown): FamilyPageData {
  return {
    savings: extractSavings(rawPage),
    upgrade: extractUpgrade(rawPage),
    benefits: extractBenefits(rawPage),
    account: extractAccount(rawPage),
  };
}

/** "Bespaard met Family" and the amount, from the block around the savings button. */
function extractSavings(rawPage: unknown): FamilyPageData["savings"] {
  const path = findPath(rawPage, (node) => readTarget(node)?.includes(SAVINGS_SHEET_PAGE) ?? false);
  const block = path && [...path].reverse().find((node) => childrenOf(node).length >= 3);
  if (!block) return null;

  const [titleNode, amountNode] = childrenOf(block);
  const title = collectTexts(titleNode);
  const amount = collectTexts(amountNode)
    .map((text) => text.text)
    .join("");
  return amount ? { title, amount } : null;
}

/** The "Bespaar extra per jaar" banner above the benefits. */
function extractUpgrade(rawPage: unknown): FamilyPageData["upgrade"] {
  const body = findBody(rawPage);
  const banner = body ? childrenOf(body)[0] : null;
  if (!banner || banner.type !== "TOUCHABLE") return null;

  const [title, subtitle] = collectTexts(banner);
  if (!title) return null;
  return {
    title,
    subtitle: subtitle ?? null,
    backgroundColor: findBackgroundColor(banner),
  };
}

/** The benefit rows: touchables that open another page. */
function extractBenefits(rawPage: unknown): FamilyText[] {
  const body = findBody(rawPage);
  const list = body ? childrenOf(body)[1] : null;
  if (!list) return [];

  return childrenOf(list).flatMap((row) => {
    if (row.type !== "TOUCHABLE") return [];
    const [label] = collectTexts(row);
    return label ? [label] : [];
  });
}

/** "Jouw Family-account": the heading and the plan and renewal rows, without their buttons. */
function extractAccount(rawPage: unknown): FamilyPageData["account"] {
  const path = findPath(rawPage, (node) => node.type === "FILLED_BUTTON");
  const section = path && [...path].reverse().find((node) => childrenOf(node).length >= 3);
  if (!section) return null;

  const [headingNode, rowsNode] = childrenOf(section);
  const [heading] = collectTexts(headingNode);
  const groups: FamilyInfoGroup[] = childrenOf(rowsNode).flatMap((row) => {
    const texts = collectTexts(row);
    return texts.length > 0 ? [{ texts }] : [];
  });

  return heading ? { heading, groups } : null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** The container that holds the upgrade banner, the benefits and the account section. */
function findBody(rawPage: unknown): PmlNode | null {
  const path = findPath(rawPage, (node) => node.type === "FILLED_BUTTON");
  if (!path) return null;
  // The body stack is the first ancestor whose first child is a touchable (the banner).
  return [...path].reverse().find((node) => childrenOf(node)[0]?.type === "TOUCHABLE") ?? null;
}

function childrenOf(node: PmlNode | null | undefined): PmlNode[] {
  if (!node) return [];
  if (Array.isArray(node.children)) return node.children as PmlNode[];
  if (node.child && typeof node.child === "object") return childrenOf(node.child as PmlNode);
  return [];
}

/** The nodes from the root down to the first node matching the predicate. */
function findPath(node: unknown, predicate: (node: PmlNode) => boolean): PmlNode[] | null {
  if (typeof node !== "object" || node === null) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const path = findPath(item, predicate);
      if (path) return path;
    }
    return null;
  }
  const record = node as PmlNode;
  if (predicate(record)) return [record];
  for (const value of Object.values(record)) {
    const path = findPath(value, predicate);
    if (path) return [record, ...path];
  }
  return null;
}

/**
 * RICH_TEXT nodes in document order. Touchables nested below `node` are
 * buttons ("Wisselen") and are skipped, since the web page is read-only.
 */
function collectTexts(node: unknown): FamilyText[] {
  const out: FamilyText[] = [];
  walkTexts(node, true, out);
  return out;
}

function walkTexts(node: unknown, isRoot: boolean, out: FamilyText[]): void {
  if (typeof node !== "object" || node === null) return;
  if (Array.isArray(node)) {
    for (const item of node) walkTexts(item, false, out);
    return;
  }
  const record = node as PmlNode;
  if (record.type === "TOUCHABLE" && !isRoot) return;
  if (record.type === "RICH_TEXT" && typeof record.markdown === "string") {
    const text = cleanMarkdown(record.markdown);
    const attrs = (record.textAttributes ?? {}) as {
      size?: unknown;
      color?: unknown;
      weight?: unknown;
    };
    if (text) {
      out.push({
        text,
        size: typeof attrs.size === "number" ? attrs.size : null,
        color: readString(attrs.color),
        weight: typeof attrs.weight === "string" ? (FONT_WEIGHTS[attrs.weight] ?? null) : null,
      });
    }
    return;
  }
  for (const [key, value] of Object.entries(record)) {
    if (key !== "onPress") walkTexts(value, false, out);
  }
}

function findBackgroundColor(node: unknown): string | null {
  const path = findPath(node, (candidate) => typeof candidate.backgroundColor === "string");
  return path ? readString(path[path.length - 1].backgroundColor) : null;
}

function readTarget(node: PmlNode): string | null {
  return readString((node.onPress as { target?: unknown } | undefined)?.target);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
