/**
 * Delivery slot banner displayed at the top of the cart page.
 *
 * Shows either a prompt ("Kies je bezorgmoment") when no explicit slot is
 * selected, or the formatted delivery window (e.g. "Morgen 14:40 - 15:40").
 * Soft gradient background with truck icon, text, and a chevron hint.
 */

type DeliverySlotBannerProps = {
  bannerText: string;
  isExplicit: boolean;
  onTap: () => void;
};

export function DeliverySlotBanner({
  bannerText,
  isExplicit,
  onTap,
}: DeliverySlotBannerProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="group flex w-full items-center gap-3.5 rounded-2xl bg-gray-100 px-5 py-4 text-left transition-all hover:bg-gray-200 hover:shadow-md active:scale-[0.99]"
    >
      {/* Truck icon with clock overlay */}
      <div className="relative flex-shrink-0 rounded-xl bg-white p-2 shadow-sm">
        <TruckIcon />
        <div className="absolute -bottom-0.5 -right-0.5">
          <ClockIcon />
        </div>
      </div>

      {/* Banner text */}
      <div className="flex flex-1 flex-col">
        <span
          className={`text-sm ${
            isExplicit
              ? "font-semibold text-foreground"
              : "font-medium text-gray-500"
          }`}
        >
          {bannerText}
        </span>
        {!isExplicit && (
          <span className="text-xs text-gray-400">Tik om te kiezen</span>
        )}
      </div>

      {/* Chevron hint */}
      <ChevronRightIcon />
    </button>
  );
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function TruckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 4h13v10H3V4Zm13 4h3l2 3v3h-5V8ZM6.5 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5" fill="white" stroke="#1f2937" strokeWidth="1" />
      <path
        d="M6 3.5V6l2 1"
        stroke="#1f2937"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
    >
      <path
        d="M7 4.5l4.5 4.5-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
