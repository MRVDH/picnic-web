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
