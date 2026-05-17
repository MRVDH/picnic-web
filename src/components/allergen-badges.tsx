"use client";

import { useTranslations } from "@/contexts/country-context";
import type { AllergenInfo } from "@/lib/types";

type AllergenBadgesProps = {
  allergens: AllergenInfo;
  title?: string;
  confirmedLabel?: string;
  mayContainLabel?: string;
};

export function AllergenBadges({
  allergens,
  title,
  confirmedLabel,
  mayContainLabel,
}: AllergenBadgesProps) {
  const t = useTranslations();
  const resolvedTitle = title ?? t.allergenTitle;
  const resolvedConfirmedLabel = confirmedLabel ?? t.recipeAllergens;
  const resolvedMayContainLabel = mayContainLabel ?? t.recipeMayContain;
  const hasConfirmed = allergens.confirmed.length > 0;
  const hasMayContain = allergens.mayContain.length > 0;

  if (!hasConfirmed && !hasMayContain) return null;

  return (
    <div className="space-y-3">
      {resolvedTitle && <h2 className="text-foreground text-lg font-semibold">{resolvedTitle}</h2>}

      {hasConfirmed && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-600">{resolvedConfirmedLabel}</p>
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
          <p className="mb-1.5 text-sm font-medium text-gray-500">{resolvedMayContainLabel}</p>
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
