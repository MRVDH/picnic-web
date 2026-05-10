"use client";

import { useState } from "react";
import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";
import { useCountryCode } from "@/contexts/country-context";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const GALLERY_IMAGE_SIZE = "large";
const THUMBNAIL_IMAGE_SIZE = "small";

type ProductGalleryProps = {
  imageIds: string[];
};

export function ProductGallery({ imageIds }: ProductGalleryProps) {
  const countryCode = useCountryCode();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const hasImages = imageIds.length > 0;
  const hasMultipleImages = imageIds.length > 1;

  const selectedId = hasImages ? imageIds[selectedIndex] : null;
  const mainImageSrc =
    selectedId && !failedIds.has(selectedId)
      ? buildImageUrl(selectedId, countryCode, GALLERY_IMAGE_SIZE)
      : PLACEHOLDER_IMAGE;

  const handleImageError = (imageId: string) => {
    setFailedIds((prev) => {
      if (prev.has(imageId)) return prev;
      const next = new Set(prev);
      next.add(imageId);
      return next;
    });
  };

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
          onError={() => {
            if (selectedId) handleImageError(selectedId);
          }}
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
                src={
                  failedIds.has(imageId)
                    ? PLACEHOLDER_IMAGE
                    : buildImageUrl(imageId, countryCode, THUMBNAIL_IMAGE_SIZE)
                }
                alt={`Thumbnail ${index + 1}`}
                fill
                className="rounded-md object-contain p-1"
                sizes="64px"
                unoptimized
                onError={() => handleImageError(imageId)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
