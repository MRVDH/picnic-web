// Translates RSC interaction actions into what the web does with them.
import { resolveDeepLinkRoute } from "@/lib/core/deep-link-route";
import type { RscAction } from "@/lib/rsc/rsc-page-types";

const PRODUCT_DETAILS_PAGE_ID = "product-details-page-root";

type RecordNode = Record<string, unknown>;

/** What a list of actions asks the web to do. Animation and feedback actions are dropped. */
export type RscIntent =
  | { type: "navigate"; route: string }
  | { type: "modify-cart"; sellingUnitId: string; modification: "ADD" | "REMOVE" };

/**
 * Read the actions of one interaction slot, e.g. `slots.rowPress.actions`.
 * Returns an empty list when the item has no such slot.
 */
export function readSlotActions(interaction: unknown, slot: string): RscAction[] {
  const slots = (interaction as { slots?: RecordNode } | undefined)?.slots;
  const actions = (slots?.[slot] as { actions?: unknown } | undefined)?.actions;
  return Array.isArray(actions)
    ? actions.filter((a): a is RscAction => typeof (a as RscAction)?.type === "string")
    : [];
}

/**
 * Map actions to web intents. `title` is used as page title for pages opened
 * through /pages. Unknown action types are ignored.
 */
export function resolveIntents(actions: RscAction[], title: string): RscIntent[] {
  const intents: RscIntent[] = [];

  for (const action of actions) {
    const payload = (action.payload ?? {}) as RecordNode;

    if (action.type === "open-deeplink" && typeof payload.deeplink === "string") {
      const route = resolveDeepLinkRoute(payload.deeplink, title);
      if (route) intents.push({ type: "navigate", route });
    } else if (action.type === "open-page" && typeof payload.pageId === "string") {
      intents.push({
        type: "navigate",
        route: resolvePageRoute(payload.pageId, payload.params, title),
      });
    } else if (action.type === "modify-cart") {
      const intent = resolveCartIntent(payload);
      if (intent) intents.push(intent);
    }
  }

  return intents;
}

/** Route for an `open-page` action: product pages have their own route, the rest go through /pages. */
function resolvePageRoute(pageId: string, params: unknown, title: string): string {
  const query = new URLSearchParams();
  if (typeof params === "object" && params !== null) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" || typeof value === "number") query.set(key, String(value));
    }
  }

  const productId = query.get("id");
  if (pageId === PRODUCT_DETAILS_PAGE_ID && productId) {
    return `/product/${encodeURIComponent(productId)}`;
  }

  // Same shape as a deep link's page id, so it reuses the deep link routing.
  const deepLink = `;id=${[pageId, ...[...query].map(([k, v]) => `${k}=${v}`)].join(",")}`;
  return resolveDeepLinkRoute(deepLink, title) ?? "/";
}

/**
 * `modify-cart` payloads name the selling unit in their enrichments:
 * `{ modificationType: "ADD", enrichments: [{ source: { sellingUnitId } }] }`.
 */
function resolveCartIntent(payload: RecordNode): RscIntent | null {
  const modification = payload.modificationType;
  if (modification !== "ADD" && modification !== "REMOVE") return null;

  const enrichments = Array.isArray(payload.enrichments) ? payload.enrichments : [];
  for (const enrichment of enrichments) {
    const source = (enrichment as { source?: RecordNode } | null)?.source;
    if (typeof source?.sellingUnitId === "string") {
      return { type: "modify-cart", sellingUnitId: source.sellingUnitId, modification };
    }
  }
  return null;
}
