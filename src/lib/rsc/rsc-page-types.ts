import type PicnicClient from "picnic-api";

/**
 * A page Picnic serves as a React Server Components payload, as a tree of its
 * components: picnic-api's `app.getRscPageContent`.
 */
export type RscPageModel = PicnicClient.Types.app.RscPageContent;

/**
 * One content component of the page. `component` is the module name, e.g.
 * "vertical-list" for ./logical-components/sections/vertical-list/vertical-list.tsx
 * or "promo-deep-dive-content" for ./pages/promotions/shared/promo-deep-dive-content.tsx.
 * Components nested in its props (e.g. `children`) are in `children`.
 */
export type RscNode = PicnicClient.Types.app.RscNode;

/**
 * An action attached to an interaction slot, e.g. `rowPress` or `imagePress`.
 * Known types: open-deeplink, open-page, modify-cart; the app also sends
 * animation/feedback actions (haptic, fly-to-basket) that the web ignores.
 */
export type RscAction = { type: string; payload?: unknown };

/** Response shape for GET /api/rsc-pages. */
export type RscPageApiResponse = RscPageModel;
