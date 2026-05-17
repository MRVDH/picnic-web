import type { AllergenInfo } from "@/lib/types";

type AllergenBadgesProps = {
  allergens: AllergenInfo;
  title?: string;
  confirmedLabel?: string;
  mayContainLabel?: string;
};

export function AllergenBadges({
  allergens,
  title = "Allergenen",
  confirmedLabel = "Bevat",
  mayContainLabel = "Bevat mogelijk",
}: AllergenBadgesProps) {
  const hasConfirmed = allergens.confirmed.length > 0;
  const hasMayContain = allergens.mayContain.length > 0;

  if (!hasConfirmed && !hasMayContain) return null;

  return (
    <div className="space-y-3">
      {title && <h2 className="text-foreground text-lg font-semibold">{title}</h2>}

      {hasConfirmed && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-600">{confirmedLabel}</p>
          <div className="flex flex-wrap gap-2">
            {allergens.confirmed.map((badge) => (
              <span
                key={badge.text}
                className="rounded px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
              >
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasMayContain && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-500">{mayContainLabel}</p>
          <div className="flex flex-wrap gap-2">
            {allergens.mayContain.map((badge) => (
              <span
                key={badge.text}
                className="rounded px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
              >
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
