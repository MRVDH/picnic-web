import type { Badge as BadgeType, BadgeVariant } from "@/lib/types";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  promo: "bg-[#fbd92b] text-[#333333]",
  discount: "bg-picnic-orange text-white",
  size: "bg-gray-200 text-gray-700",
  freshness: "bg-picnic-green text-white",
  availability: "bg-picnic-yellow text-gray-800",
  info: "bg-picnic-blue text-white",
  "unit-price": "bg-gray-100 text-gray-600",
};

type BadgeProps = {
  badge: BadgeType;
};

export function Badge({ badge }: BadgeProps) {
  const classes = VARIANT_CLASSES[badge.variant];

  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium leading-tight ${classes}`}
    >
      {badge.text}
    </span>
  );
}
