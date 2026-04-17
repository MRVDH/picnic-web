/**
 * Parse a Picnic deep-link target string and extract a routable page ID.
 *
 * Deep links follow the format:
 *   app.picnic://store/page;id=L1-category-page-root,category_id=21724
 *   app.picnic://store/page;id=some-other-page-root
 *
 * The page ID portion after ";id=" uses commas to separate the base page
 * from its parameters. The first comma-separated value is the base page
 * ID, and any subsequent "key=value" pairs become query-string parameters:
 *   "L1-category-page-root,category_id=21724" → "L1-category-page-root?category_id=21724"
 *   "some-other-page-root" → "some-other-page-root"
 *
 * Returns the converted page ID string, or null if the target cannot be parsed.
 */
export function parsePageIdFromDeepLink(
  target: string,
): string | null {
  const match = /;id=([^,]+)(.*)/.exec(target);
  if (!match) {
    return null;
  }

  const basePage = match[1].trim();
  if (!basePage) {
    return null;
  }

  const remainingParams = match[2];
  if (!remainingParams) {
    return basePage;
  }

  // Convert ",key=value,key2=value2" → "?key=value&key2=value2"
  const queryString = remainingParams
    .split(",")
    .filter((segment) => segment.includes("="))
    .join("&");

  if (!queryString) {
    return basePage;
  }

  return `${basePage}?${queryString}`;
}
