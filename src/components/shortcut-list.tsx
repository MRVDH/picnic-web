"use client";

import Image from "next/image";
import { buildImageUrl } from "@/lib/image-url";
import type { ShortcutItem } from "@/lib/category-types";
import { useCountryCode } from "@/contexts/country-context";

const SHORTCUT_SECTION_TITLE = "Snel naar";

type ShortcutListProps = {
  shortcuts: ShortcutItem[];
  onShortcutTap?: (shortcut: ShortcutItem) => void;
};

export function ShortcutList({ shortcuts, onShortcutTap }: ShortcutListProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-foreground mb-3 text-lg font-semibold">{SHORTCUT_SECTION_TITLE}</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {shortcuts.map((shortcut, index) => (
          <ShortcutRow
            key={shortcut.id}
            shortcut={shortcut}
            isLast={index === shortcuts.length - 1}
            onTap={onShortcutTap}
          />
        ))}
      </div>
    </div>
  );
}

function ShortcutRow({
  shortcut,
  isLast,
  onTap,
}: {
  shortcut: ShortcutItem;
  isLast: boolean;
  onTap?: (shortcut: ShortcutItem) => void;
}) {
  const countryCode = useCountryCode();
  return (
    <button
      type="button"
      onClick={() => onTap?.(shortcut)}
      className={`flex w-full items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50 active:bg-gray-100 ${isLast ? "" : "border-b border-gray-100"}`}
    >
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={buildImageUrl(shortcut.imageId, countryCode)}
          alt={shortcut.name}
          fill
          unoptimized
          className="object-contain"
          sizes="56px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-foreground text-[15px] leading-tight font-medium">
          {shortcut.name}
        </span>
        {shortcut.badge && (
          <span className="rounded bg-[#fbd92b] px-1.5 py-0.5 text-xs font-medium text-black">
            {shortcut.badge}
          </span>
        )}
      </div>

      <ChevronRightIcon />
    </button>
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
