// Turns a parsed RSC page (picnic-api's getRscPage) into the model the web
// renderer uses: the theme tokens and a tree of content components.
import type { RscNode, RscPageModel } from "@/lib/rsc/rsc-page-types";

/** Shape returned by picnic-api's `app.getRscPage`. */
type RscPage = { rows: Record<string, unknown>; modules: Record<string, unknown> };

type RecordNode = Record<string, unknown>;

const ROOT_ROW_ID = "0";
/** "$L8" / "$8": a reference to row (or, as element type, module) 8. */
const REFERENCE_PATTERN = /^\$L?([0-9a-f]+)$/;
/** "$4:props:items:0:payload": a reference to a value inside row 4, used to dedupe data. */
const PATH_REFERENCE_PATTERN = /^\$([0-9a-f]+):(.+)$/;
const MODULE_NAME_PATTERN = /([^/]+)\.[jt]sx?$/;
/** Modules that only provide context (page data, cart, icons); their children are the content. */
const WRAPPER_COMPONENTS = new Set([
  "pages-provider-hydrator",
  "page-hydrator",
  "IconRegistry",
  "icon-registry",
]);
const MAX_REFERENCE_DEPTH = 20;

/**
 * Walk the RSC tree from the root row and build the content component tree.
 * React elements are tuples `["$", type, key, props]`; an element type "$L8"
 * refers to client module 8, other "$L7" / "$7" strings refer to row 7.
 */
export function parseRscPage(pageId: string, page: RscPage): RscPageModel {
  let tokens: Record<string, string> = {};
  let nextId = 0;

  const resolveModuleName = (type: string): string | null => {
    const moduleId = REFERENCE_PATTERN.exec(type)?.[1];
    const moduleRef = moduleId ? page.modules[moduleId] : null;
    const path = Array.isArray(moduleRef) ? moduleRef[0] : null;
    return typeof path === "string" ? (MODULE_NAME_PATTERN.exec(path)?.[1] ?? null) : null;
  };

  /**
   * Resolve references and split a value into plain data and the component
   * nodes nested in it. Nested elements are removed from the data.
   */
  const convert = (value: unknown, nodes: RscNode[], depth: number): unknown => {
    if (typeof value === "string") {
      if (value === "$undefined") return undefined;
      if (depth > MAX_REFERENCE_DEPTH) return undefined;

      const rowId = REFERENCE_PATTERN.exec(value)?.[1];
      if (rowId && rowId in page.rows) return convert(page.rows[rowId], nodes, depth + 1);

      const pathRef = PATH_REFERENCE_PATTERN.exec(value);
      if (pathRef && pathRef[1] in page.rows) {
        return convert(resolvePath(page.rows, pathRef[1], pathRef[2]), nodes, depth + 1);
      }
      return value;
    }
    if (typeof value !== "object" || value === null) return value;

    if (Array.isArray(value)) {
      if (value[0] === "$" && typeof value[1] === "string") {
        nodes.push(...convertElement(value, depth));
        return undefined;
      }
      const items = value
        .map((item) => convert(item, nodes, depth))
        .filter((item) => item !== undefined);
      // An array that only held elements (e.g. `children`) has nothing left as data.
      return items.length === 0 && value.length > 0 ? undefined : items;
    }

    const record = value as RecordNode;
    // The page theme: `tokenRegistry` holds the semantic tokens ("Action/primary"),
    // `legacyColors` the palette names components use ("YELLOW2", "GOLD1").
    if (typeof record.tokenRegistry === "object" && record.tokenRegistry !== null) {
      tokens = {
        ...readStrings(record.tokenRegistry as RecordNode),
        ...readStrings((record.legacyColors ?? {}) as RecordNode),
      };
    }

    const result: RecordNode = {};
    for (const [key, item] of Object.entries(record)) {
      const converted = convert(item, nodes, depth);
      if (converted !== undefined) result[key] = converted;
    }
    return result;
  };

  /** Wrappers pass their children through; other elements become a node. */
  const convertElement = (element: unknown[], depth: number): RscNode[] => {
    const component = resolveModuleName(element[1] as string);
    const children: RscNode[] = [];
    const props = (convert(element[3] ?? {}, children, depth) ?? {}) as RecordNode;

    if (!component || WRAPPER_COMPONENTS.has(component)) return children;
    return [{ id: `${component}-${nextId++}`, component, props, children }];
  };

  const nodes: RscNode[] = [];
  convert(page.rows[ROOT_ROW_ID], nodes, 0);
  return { pageId, tokens, nodes };
}

/**
 * Follow a path like "props:items:0:payload" into a row. "props" on a React
 * element tuple means its props (index 3); row references on the way ("$L5")
 * are followed.
 */
function resolvePath(rows: Record<string, unknown>, rowId: string, path: string): unknown {
  let current: unknown = rows[rowId];
  for (const segment of path.split(":")) {
    const rowRef = typeof current === "string" ? REFERENCE_PATTERN.exec(current)?.[1] : null;
    if (rowRef && rowRef in rows) current = rows[rowRef];

    if (Array.isArray(current)) {
      current = current[0] === "$" && segment === "props" ? current[3] : current[Number(segment)];
    } else if (typeof current === "object" && current !== null) {
      current = (current as RecordNode)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function readStrings(record: RecordNode): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}
