/**
 * A page Picnic serves as a React Server Components payload, reduced to what
 * the web renderer needs. See parse-rsc-page.ts for how it's built.
 */
export type RscPageModel = {
  pageId: string;
  /** Design tokens from the page theme, e.g. "YELLOW2" → "#FBD92B". */
  tokens: Record<string, string>;
  /** The page's section components in render order. */
  sections: RscSection[];
};

/**
 * One section component, e.g. a vertical list. `component` is the module
 * name from Picnic's page platform ("vertical-list" for
 * ./logical-components/sections/vertical-list/vertical-list.tsx).
 */
export type RscSection = {
  id: string;
  component: string;
  props: Record<string, unknown>;
};

/** Response shape for GET /api/rsc-pages. */
export type RscPageApiResponse = RscPageModel;
