/**
 * Utility to construct Picnic image URLs from image IDs.
 */

const COUNTRY_CODE = process.env.NEXT_PUBLIC_PICNIC_COUNTRY_CODE || "nl";
const BASE = `https://storefront-prod.${COUNTRY_CODE}.picnicinternational.com/static/images`;

export type PicnicImageSize = "tiny" | "small" | "medium" | "large" | "extra-large";

/**
 * Build a full image URL from a Picnic image hash.
 *
 * Note: The Picnic CDN always serves images as .png regardless of the extension
 * specified in the PML data (which may say "webp"). Always use "png" here.
 */
export function getImageUrl(
  imageId: string,
  size: PicnicImageSize = "medium",
): string {
  return `${BASE}/${imageId}/${size}.png`;
}
