import { IMAGE_CDN_BASE, DEFAULT_IMAGE_SIZE } from "./types";

/**
 * Builds a Picnic CDN image URL for a given image ID.
 * Always uses .png format per FR-013.
 */
export function buildImageUrl(
  imageId: string,
  size: string = DEFAULT_IMAGE_SIZE,
): string {
  return `${IMAGE_CDN_BASE}/${imageId}/${size}.png`;
}
