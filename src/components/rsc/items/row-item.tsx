"use client";

import Image from "next/image";

import { resolveColor, useRscRenderContext } from "@/components/rsc/rsc-render-context";
import type { RscItemProps } from "@/components/rsc/sections/vertical-list";
import { useCountryCode } from "@/contexts/country-context";
import { ICON_ASSETS } from "@/lib/core/icon-assets";
import { buildImageUrl } from "@/lib/core/image-url";

/**
 * The laurel-decorated word ("Versmarkt") has no color in the payload: the
 * app's row item draws it in the GOLD1 token (#95710F, the same color the
 * Fusion version of the page uses).
 */
const LAUREL_COLOR_TOKEN = "GOLD1";
const LAUREL_FALLBACK_COLOR = "#95710F";
const LAUREL_ICON_WIDTH = 8;
const LAUREL_ICON_HEIGHT = 16;

type RowLabel = { title?: string; backgroundColor?: string; textColor?: string };

/**
 * A tappable row with an image, a title, an optional label (e.g.
 * "1300+ producten") and an optional laurel-decorated word.
 */
export function RowItem({ item, isLast }: RscItemProps) {
  const { tokens, onOpenDeepLink } = useRscRenderContext();
  const countryCode = useCountryCode();

  const title = typeof item.title === "string" ? item.title : "";
  const deepLink = typeof item.deeplink === "string" ? item.deeplink : null;
  const imageId = typeof item.image === "string" ? item.image : null;
  const laurelText = readString((item.laurelLeaf as Record<string, unknown> | undefined)?.text);
  const label = item.label as RowLabel | undefined;
  const showChevron = (item.displayConfig as { chevron?: boolean } | undefined)?.chevron !== false;

  const fullTitle = [title, laurelText].filter(Boolean).join(" ");
  const laurelColor = tokens[LAUREL_COLOR_TOKEN] ?? LAUREL_FALLBACK_COLOR;

  return (
    <button
      type="button"
      disabled={!deepLink}
      onClick={() => deepLink && onOpenDeepLink(deepLink, fullTitle)}
      className={`flex w-full items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50 active:bg-gray-100 ${isLast ? "" : "border-b border-gray-100"}`}
    >
      {imageId && (
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={buildImageUrl(imageId, countryCode)}
            alt={fullTitle}
            fill
            unoptimized
            className="object-contain"
            sizes="56px"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-foreground flex flex-wrap items-center gap-x-[3px] text-left text-[15px] leading-tight font-medium">
          {title && <span>{title}</span>}
          {laurelText && (
            <>
              <TintedIcon iconKey="laurelLeafLeft" color={laurelColor} />
              <span style={{ color: laurelColor }}>{laurelText}</span>
              <TintedIcon iconKey="laurelLeafRight" color={laurelColor} />
            </>
          )}
        </span>
        {label?.title && (
          <span
            className="rounded bg-[#fbd92b] px-1.5 py-0.5 text-xs font-medium text-black"
            style={{
              backgroundColor: resolveColor(tokens, label.backgroundColor),
              color: resolveColor(tokens, label.textColor),
            }}
          >
            {label.title}
          </span>
        )}
      </div>

      {showChevron && <ChevronRightIcon />}
    </button>
  );
}

/** The app tints its icon bitmaps, so use the bitmap as a mask filled with the color. */
function TintedIcon({ iconKey, color }: { iconKey: string; color: string }) {
  const source = ICON_ASSETS[iconKey];
  if (!source) return null;

  const mask = `url(${source}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className="inline-block flex-shrink-0"
      style={{
        width: LAUREL_ICON_WIDTH,
        height: LAUREL_ICON_HEIGHT,
        backgroundColor: color,
        mask,
        WebkitMask: mask,
      }}
    />
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
