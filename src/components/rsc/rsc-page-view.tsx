"use client";

import { type ComponentType, type ReactNode, useCallback, useMemo } from "react";

import { useRouter } from "next/navigation";

import { RscRenderContext } from "@/components/rsc/rsc-render-context";
import { SellableOverviewItems } from "@/components/rsc/sections/sellable-overview-items";
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
  // A category's subcategories (subcategory-page): the same row items as the category tree.
  "category-list": VerticalList,
};

/**
 * Web components for page-platform components whose module name is too
 * generic to register by name, keyed by the end of their module path.
 */
const COMPONENTS_BY_PATH: [pathSuffix: string, component: ComponentType<RscComponentProps>][] = [
  // The product sections of a category (category-product-overview).
  ["/sellable-overview/components/items.tsx", SellableOverviewItems],
];

function resolveComponent(node: RscNode): ComponentType<RscComponentProps> | undefined {
  const byPath = COMPONENTS_BY_PATH.find(([suffix]) => node.modulePath.endsWith(suffix));
  return byPath?.[1] ?? COMPONENTS[node.component];
}

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
    const Component = resolveComponent(node);
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
