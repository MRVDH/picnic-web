import Image from "next/image";
import Link from "next/link";
import type { SliderProduct } from "@/lib/types";
import { CENTS_DIVISOR } from "@/lib/types";
import { buildImageUrl } from "@/lib/image-url";

type ProductSliderCardProps = {
  product: SliderProduct;
  href: string;
};

/** Format a price in cents to a euro display string. */
function formatPrice(cents: number): string {
  return `\u20AC${(cents / CENTS_DIVISOR).toFixed(2)}`;
}

export function ProductSliderCard({ product, href }: ProductSliderCardProps) {
  return (
    <Link
      href={href}
      className="flex w-36 shrink-0 flex-col rounded-lg border border-card-border bg-card-bg p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative mb-2 h-24 w-full">
        <Image
          src={buildImageUrl(product.imageId)}
          alt={product.name}
          fill
          className="object-contain"
          sizes="128px"
          unoptimized
        />
      </div>

      <p className="text-xs font-medium leading-snug text-foreground line-clamp-2">
        {product.name}
      </p>

      <p className="mt-0.5 text-xs text-gray-500">{product.unitQuantity}</p>

      <p className="mt-auto pt-1 text-sm font-bold text-foreground">
        {formatPrice(product.displayPrice)}
      </p>
    </Link>
  );
}
