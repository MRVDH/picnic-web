import type { ProductHighlightItem } from "@/lib/types";
import { renderPmlMarkdown } from "@/lib/parse-pml-markdown";

type ProductHighlightsProps = {
  highlights: ProductHighlightItem[];
};

/** Map known PML icon keys to simple emoji/unicode fallbacks. */
const ICON_MAP: Record<string, string> = {
  starsOutlined: "\u2728",
  pin: "\uD83D\uDCCC",
  snowflake: "\u2744\uFE0F",
  clock: "\uD83D\uDD52",
  leaf: "\uD83C\uDF3F",
  leafOutlined: "\uD83C\uDF3F",
  freshLeaf: "\uD83C\uDF3F",
  qualityLeaf: "\uD83C\uDF3F",
  heart: "\u2764\uFE0F",
  fire: "\uD83D\uDD25",
  check: "\u2705",
  checkCircle: "\u2705",
  checkCircleOutlined: "\u2705",
  checkOutlined: "\u2705",
  verified: "\u2705",
  star: "\u2B50",
  info: "\u2139\uFE0F",
  infoCircle: "\u2139\uFE0F",
  trophy: "\uD83C\uDFC6",
  crown: "\uD83D\uDC51",
  priceTag: "\uD83C\uDFF7\uFE0F",
  tag: "\uD83C\uDFF7\uFE0F",
  shieldCheck: "\uD83D\uDEE1\uFE0F",
  calendar: "\uD83D\uDCC5",
  apple: "\uD83C\uDF4E",
  whisk: "\uD83C\uDF75",
  list: "\uD83D\uDCCB",
  shareIcon: "\uD83D\uDD17",
};

/** Fallback icon for unknown icon keys. */
const FALLBACK_ICON = "\u25CF";

export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="divide-y divide-gray-100">
      {highlights.map((item, index) => {
        const icon = item.iconKey
          ? (ICON_MAP[item.iconKey] ?? FALLBACK_ICON)
          : null;

        const content = (
          <div className="flex items-center gap-3 py-3">
            {icon && (
              <span className="shrink-0 text-base" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="text-sm text-foreground">
              {renderPmlMarkdown(item.text)}
            </span>
          </div>
        );

        // If this highlight has a link target, we can't use it as a web URL
        // (it's a deep link like nl.picnic-supermarkt://...), so just show it
        // as styled text
        if (item.linkTarget) {
          return (
            <div
              key={`highlight-${index}`}
              className="cursor-default text-gray-600"
            >
              {content}
            </div>
          );
        }

        return (
          <div key={`highlight-${index}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
