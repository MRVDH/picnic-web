"use client";

import Image from "next/image";
import Link from "next/link";

import { useCountryCode } from "@/contexts/country-context";
import { formatPrice } from "@/lib/format-price";
import { buildImageUrl } from "@/lib/image-url";
import type { SliderProduct } from "@/lib/types";

type ProductSliderCardProps = {
  product: SliderProduct;
  href: string;
};

export function ProductSliderCard({ product, href }: ProductSliderCardProps) {
  const countryCode = useCountryCode();
  return (
    <Link
      href={href}
      className="border-card-border bg-card-bg flex w-36 shrink-0 flex-col rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative mb-2 h-24 w-full">
        <Image
          src={buildImageUrl(product.imageId, countryCode)}
          alt={product.name}
          fill
          className="object-contain"
          sizes="128px"
          unoptimized
        />
      </div>

      <p className="text-foreground line-clamp-2 text-xs leading-snug font-medium">
        {product.name}
      </p>

      <p className="mt-0.5 text-xs text-gray-500">{product.unitQuantity}</p>

      <p className="text-foreground mt-auto pt-1 text-sm font-bold">
        {formatPrice(product.displayPrice)}
      </p>
    </Link>
  );
}
