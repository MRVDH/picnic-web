/**
 * A page Picnic serves as a React Server Components payload, reduced to what
 * the web renderer needs. See parse-rsc-page.ts for how it's built.
 */
export type RscPageModel = {
  pageId: string;
  /** Design tokens and palette colors from the page theme, e.g. "YELLOW2" → "#FBD92B". */
  tokens: Record<string, string>;
  /** The page's content components in render order. */
  nodes: RscNode[];
};

/**
 * One content component of the page. `component` is the module name, e.g.
 * "vertical-list" for ./logical-components/sections/vertical-list/vertical-list.tsx
 * or "promo-deep-dive-content" for ./pages/promotions/shared/promo-deep-dive-content.tsx.
 * Components nested in its props (e.g. `children`) are in `children`.
 */
export type RscNode = {
  id: string;
  component: string;
  props: Record<string, unknown>;
  children: RscNode[];
};

/**
 * An action attached to an interaction slot, e.g. `rowPress` or `imagePress`.
 * Known types: open-deeplink, open-page, modify-cart; the app also sends
 * animation/feedback actions (haptic, fly-to-basket) that the web ignores.
 */
export type RscAction = { type: string; payload?: unknown };

/** Response shape for GET /api/rsc-pages. */
export type RscPageApiResponse = RscPageModel;
