import type { SliderProduct } from "@/lib/types";
import { ProductSliderCard } from "./product-slider-card";

type ProductSliderProps = {
  title: string;
  products: SliderProduct[];
};

export function ProductSlider({ title, products }: ProductSliderProps) {
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <ProductSliderCard
            key={product.id}
            product={product}
            href={`/product/${product.id}`}
          />
        ))}
      </div>
    </div>
  );
}
