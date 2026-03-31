"use client";

import { useState } from "react";
import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const GALLERY_IMAGE_SIZE = "large";
const THUMBNAIL_IMAGE_SIZE = "small";

type ProductGalleryProps = {
  imageIds: string[];
};

export function ProductGallery({ imageIds }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasImages = imageIds.length > 0;
  const hasMultipleImages = imageIds.length > 1;

  const mainImageSrc = hasImages
    ? buildImageUrl(imageIds[selectedIndex], GALLERY_IMAGE_SIZE)
    : PLACEHOLDER_IMAGE;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main image */}
      <div className="relative h-64 w-full max-w-md sm:h-80">
        <Image
          src={mainImageSrc}
          alt="Product image"
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, 448px"
          unoptimized
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageIds.map((imageId, index) => (
            <button
              key={imageId}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative h-16 w-16 shrink-0 rounded-md border-2 transition-colors ${
                index === selectedIndex
                  ? "border-picnic-red"
                  : "border-card-border hover:border-gray-400"
              }`}
            >
              <Image
                src={buildImageUrl(imageId, THUMBNAIL_IMAGE_SIZE)}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="rounded-md object-contain p-1"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
