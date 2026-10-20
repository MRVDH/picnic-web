import type { ProductLabel } from "@/lib/core/types";

type ProductInfoHeaderProps = {
  name: string;
  brand: string;
  quantityBadges: ProductLabel[];
  unitQuantity: string;
  unitPrice: string | null;
  tags: { text: string; color: string | null }[];
};

export function ProductInfoHeader({
  name,
  brand,
  quantityBadges,
  unitQuantity,
  unitPrice,
  tags,
}: ProductInfoHeaderProps) {
  const details = [unitQuantity, unitPrice].filter((text): text is string => Boolean(text));

  return (
    <div>
      <h1 className="text-foreground text-2xl font-bold">{name}</h1>

      {brand && <p className="mt-1 text-base text-gray-500">{brand}</p>}

      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        {quantityBadges.map((badge) => (
          <span
            key={badge.text}
            className="rounded px-1.5 text-xs font-bold"
            style={{ color: badge.textColor, backgroundColor: badge.backgroundColor }}
          >
            {badge.text}
          </span>
        ))}
        {details.map((text, index) => (
          <span key={text} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">&middot;</span>}
            <span>{text}</span>
          </span>
        ))}
        {tags.map((tag) => (
          <span key={tag.text} className="flex items-center gap-2">
            {details.length > 0 && <span aria-hidden="true">&middot;</span>}
            <span style={tag.color ? { color: tag.color } : undefined} className="font-medium">
              {tag.text}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
