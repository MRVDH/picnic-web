import { type CountryCode, DEFAULT_IMAGE_SIZE, getImageCdnBase } from "./types";

/**
 * Builds a Picnic CDN image URL for a given image ID and country.
 * Always uses .png format per FR-013.
 */
export function buildImageUrl(
  imageId: string,
  countryCode: CountryCode,
  size: string = DEFAULT_IMAGE_SIZE
): string {
  return `${getImageCdnBase(countryCode)}/${imageId}/${size}.png`;
}

/**
 * Builds a CDN URL for a recipe hero image.
 * Recipe images are served as WebP at a fixed 600×600 size and are publicly
 * accessible — no auth or proxy needed. Using .png or other sizes returns 403.
 */
export function buildRecipeImageUrl(imageId: string, countryCode: CountryCode): string {
  return `${getImageCdnBase(countryCode)}/${imageId}/filled-600x600.webp`;
}
