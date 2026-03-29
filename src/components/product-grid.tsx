import type { Product, SearchSection } from "@/lib/types";
import { buildSectionId } from "@/lib/types";
import { ProductCard } from "./product-card";

type ProductGridProps =
  | { sections: SearchSection[]; products?: never }
  | { products: Product[]; sections?: never };

export function ProductGrid(props: ProductGridProps) {
  // Section-based rendering: each section gets a header + grid
  if (props.sections && props.sections.length > 0) {
    return (
      <div className="space-y-8">
        {props.sections.map((section, index) => (
          <section
            key={section.title}
            id={buildSectionId(index)}
            className="scroll-mt-36"
          >
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Flat rendering fallback (no sections available)
  const products = props.products ?? [];
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
