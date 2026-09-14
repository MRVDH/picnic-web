/**
 * Picnic reports two unrelated quantities per recipe ingredient. The analytics
 * `quantity` is always 1 ("buy one pack"), so it can never reveal a saving:
 * ceil(1 + 1) equals ceil(1) + ceil(1). The real need lives in the ingredient
 * tile text instead — "(125 g benötigt)" against a "500g" package — and
 * dividing those gives the fraction of a package a recipe actually uses, which
 * is what makes consolidating a shared ingredient across recipes save anything.
 */

type Measure = { value: number; unit: string };

/** Everything comparable normalizes to grams or millilitres. */
const UNIT_FACTORS: Record<string, { base: "g" | "ml"; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  cl: { base: "ml", factor: 10 },
  l: { base: "ml", factor: 1000 },
};

function parseNumber(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

function normalize(measure: Measure | null): { base: string; value: number } | null {
  if (!measure) return null;
  const entry = UNIT_FACTORS[measure.unit.toLowerCase()];
  if (!entry) return null;
  return { base: entry.base, value: measure.value * entry.factor };
}

/** "(125 g benötigt)" / "(0.5 Stk. benötigt)" / "(100 ml nodig)" → value + unit. */
function parseNeeded(text: string | null): Measure | null {
  if (!text) return null;
  const match = /^\(\s*(\d+(?:[.,]\d+)?)\s*([^\s)]+)/.exec(text.trim());
  return match ? { value: parseNumber(match[1]), unit: match[2] } : null;
}

/** "500g" / "400ml" / "1,5 l" → value + unit. */
function parsePackage(text: string | null): Measure | null {
  if (!text) return null;
  const match = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/.exec(text.trim());
  return match ? { value: parseNumber(match[1]), unit: match[2] } : null;
}

/**
 * Fraction of one package this recipe needs, or null when it cannot be derived:
 * no tile text, no package size, or units that don't compare ("0.5 Stk."
 * against a "500g" pack, "1 Dose" against "160g"). Callers fall back to the
 * ingredient's own `quantity`, which conservatively means a whole package.
 */
export function packageFraction(
  recipeQuantityText: string | null,
  recipePackageSize: string | null
): number | null {
  const needed = normalize(parseNeeded(recipeQuantityText));
  const pack = normalize(parsePackage(recipePackageSize));
  if (!needed || !pack || needed.base !== pack.base) return null;
  if (!(needed.value > 0) || !(pack.value > 0)) return null;
  return needed.value / pack.value;
}
