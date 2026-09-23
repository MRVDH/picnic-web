"use client";

import { useMemo } from "react";

import { ProductGrid } from "@/components/product/product-grid";
import type { RscComponentProps } from "@/components/rsc/rsc-page-view";
import { useRscRenderContext } from "@/components/rsc/rsc-render-context";
import { useTranslations } from "@/contexts/country-context";
import type { Product } from "@/lib/core/types";
import { mapSellableTile } from "@/lib/rsc/map-sellable-tile";

/**
 * The products of one promotion group (promo-group-deep-dive), e.g. all
 * "1+1 gratis" Johma salads. Tiles render with the regular ProductCard, which
 * handles the cart itself.
 */
export function PromoDeepDiveContent({ node }: RscComponentProps) {
  const t = useTranslations();
  const { tokens } = useRscRenderContext();
  const tiles = node.props.sellableTiles;

  const products = useMemo(
    () =>
      (Array.isArray(tiles) ? tiles : []).flatMap((tile) => {
        const product = mapSellableTile((tile ?? {}) as Record<string, unknown>, tokens);
        return product ? [product] : ([] as Product[]);
      }),
    [tiles, tokens]
  );

  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">{t.noProductsInCategory}</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {products.length} {products.length === 1 ? t.productSingular : t.productPlural}
      </p>
      <ProductGrid products={products} />
    </div>
  );
}
