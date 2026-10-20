"use client";

import { useMemo } from "react";

import { ProductGrid } from "@/components/product/product-grid";
import type { RscComponentProps } from "@/components/rsc/rsc-page-view";
import { useRscRenderContext } from "@/components/rsc/rsc-render-context";
import { useTranslations } from "@/contexts/country-context";
import { mapProductSections } from "@/lib/product/map-product-tile";

/**
 * The product sections of a category (category-product-overview), e.g.
 * "Bananen", "Appels" and "Peren". picnic-api parses the tiles. A section the
 * app shows without a header (`shouldShowHeader` false) renders without one.
 */
export function SellableOverviewItems({ node }: RscComponentProps) {
  const t = useTranslations();
  const { tokens } = useRscRenderContext();
  const rawSections = node.props.sections;

  const { products, sections } = useMemo(
    () =>
      mapProductSections(
        (Array.isArray(rawSections) ? rawSections : []).map((value) => {
          const section = (value ?? {}) as Record<string, unknown>;
          const header = typeof section.headerName === "string" ? section.headerName : null;
          return { title: section.shouldShowHeader ? header : null, products: section.items };
        }),
        tokens
      ),
    [rawSections, tokens]
  );

  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">{t.noProductsInCategory}</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {products.length} {products.length === 1 ? t.productSingular : t.productPlural}
      </p>
      <ProductGrid sections={sections} />
    </div>
  );
}
