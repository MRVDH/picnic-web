// Turns a parsed RSC page (picnic-api's getRscPage) into the model the web
// renderer uses: the theme tokens and the page's section components in order.
import type { RscPageModel, RscSection } from "@/lib/rsc/rsc-page-types";

/** Shape returned by picnic-api's `app.getRscPage`. */
type RscPage = { rows: Record<string, unknown>; modules: Record<string, unknown> };

type RecordNode = Record<string, unknown>;

/** Section components live under this path in Picnic's page platform. */
const SECTION_MODULE_PATTERN = /\/logical-components\/sections\/[^/]+\/([^/]+)\.tsx$/;
const REFERENCE_PATTERN = /^\$L?([0-9a-f]+)$/;
const ROOT_ROW_ID = "0";

/**
 * Walk the RSC tree from the root row and collect every section element in
 * render order. React elements are tuples `["$", type, key, props]`; an
 * element type "$L8" refers to client module 8, other "$L7" / "$7" strings
 * refer to row 7.
 */
export function parseRscPage(pageId: string, page: RscPage): RscPageModel {
  const sections: RscSection[] = [];
  const visitedRows = new Set<string>();
  let tokens: Record<string, string> = {};

  const walk = (node: unknown): void => {
    if (typeof node === "string") {
      const rowId = REFERENCE_PATTERN.exec(node)?.[1];
      if (rowId && rowId in page.rows && !visitedRows.has(rowId)) {
        visitedRows.add(rowId);
        walk(page.rows[rowId]);
      }
      return;
    }
    if (typeof node !== "object" || node === null) return;

    if (Array.isArray(node)) {
      if (node[0] === "$" && typeof node[1] === "string") {
        const props = (node[3] ?? {}) as RecordNode;
        const component = resolveSectionComponent(node[1], page.modules);
        if (component) {
          sections.push({
            id: `${component}-${sections.length}`,
            component,
            props: cleanProps(props),
          });
        }
        walk(props);
        return;
      }
      for (const item of node) walk(item);
      return;
    }

    const record = node as RecordNode;
    // The page theme: `tokenRegistry` holds the semantic tokens ("Action/primary"),
    // `legacyColors` the palette names components use ("YELLOW2", "GOLD1").
    if (typeof record.tokenRegistry === "object" && record.tokenRegistry !== null) {
      tokens = {
        ...readTokens(record.tokenRegistry as RecordNode),
        ...readTokens((record.legacyColors ?? {}) as RecordNode),
      };
    }
    for (const value of Object.values(record)) walk(value);
  };

  walk(page.rows[ROOT_ROW_ID]);
  return { pageId, tokens, sections };
}

/** Map an element type like "$L8" to a section name, if module 8 is a section. */
function resolveSectionComponent(type: string, modules: Record<string, unknown>): string | null {
  const moduleId = REFERENCE_PATTERN.exec(type)?.[1];
  if (!moduleId) return null;

  const moduleRef = modules[moduleId];
  const path = Array.isArray(moduleRef) ? moduleRef[0] : null;
  if (typeof path !== "string") return null;

  return SECTION_MODULE_PATTERN.exec(path)?.[1] ?? null;
}

function readTokens(registry: RecordNode): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [key, value] of Object.entries(registry)) {
    if (typeof value === "string") tokens[key] = value;
  }
  return tokens;
}

/**
 * Drop RSC placeholders ("$undefined") and unresolved references so the props
 * are plain data. Nested elements stay as they are; renderers ignore them.
 */
function cleanProps(value: unknown): RecordNode {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v === "$undefined" ? undefined : v))
  ) as RecordNode;
}
