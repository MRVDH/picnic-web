"use client";

import { type ComponentType, type ReactNode, useCallback, useMemo } from "react";

import { useRouter } from "next/navigation";

import { RscRenderContext } from "@/components/rsc/rsc-render-context";
import { PromoDeepDiveContent } from "@/components/rsc/sections/promo-deep-dive-content";
import { VerticalList } from "@/components/rsc/sections/vertical-list";
import { useCartOptional } from "@/contexts/cart-context";
import { resolveIntents } from "@/lib/rsc/rsc-actions";
import type { RscAction, RscNode, RscPageModel } from "@/lib/rsc/rsc-page-types";

export type RscComponentProps = {
  node: RscNode;
  /** The node's nested components, already rendered. */
  children: ReactNode;
};

/**
 * Web components for Picnic's page-platform components, keyed by module name.
 * A component without an entry renders only its children, so unsupported
 * wrappers (e.g. page-header-scroll-view) don't hide the content inside them.
 */
const COMPONENTS: Record<string, ComponentType<RscComponentProps>> = {
  "vertical-list": VerticalList,
  "promo-deep-dive-content": PromoDeepDiveContent,
};

/** Cart changes from actions don't carry a max count; the cart API enforces the real limit. */
const ACTION_MAX_COUNT = 99;

/** Render a page Picnic serves as React Server Components with the web registry. */
export function RscPageView({ page }: { page: RscPageModel }) {
  const router = useRouter();
  const cart = useCartOptional();

  const dispatch = useCallback(
    (actions: RscAction[], title: string) => {
      for (const intent of resolveIntents(actions, title)) {
        if (intent.type === "navigate") {
          router.push(intent.route);
        } else if (cart && intent.modification === "ADD") {
          cart.addProduct(intent.sellingUnitId, ACTION_MAX_COUNT);
        } else if (cart) {
          cart.removeProduct(intent.sellingUnitId);
        }
      }
    },
    [router, cart]
  );

  const context = useMemo(() => ({ tokens: page.tokens, dispatch }), [page.tokens, dispatch]);

  return (
    <RscRenderContext.Provider value={context}>
      <RscNodes nodes={page.nodes} />
    </RscRenderContext.Provider>
  );
}

function RscNodes({ nodes }: { nodes: RscNode[] }) {
  return nodes.map((node) => {
    const children = <RscNodes nodes={node.children} />;
    const Component = COMPONENTS[node.component];
    return Component ? (
      <Component key={node.id} node={node}>
        {children}
      </Component>
    ) : (
      <div key={node.id} className="contents">
        {children}
      </div>
    );
  });
}
