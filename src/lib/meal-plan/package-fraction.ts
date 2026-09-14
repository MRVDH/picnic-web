/**
 * Picnic reports two unrelated quantities per recipe ingredient. The analytics
 * `quantity` is always 1 ("buy one pack"), so it can never reveal a saving:
 * ceil(1 + 1) equals ceil(1) + ceil(1). The real need lives in the ingredient
 * tile text instead — "(125 g benötigt)" against a "500g" package — and the
 * fraction of a package a recipe actually uses is what makes consolidating a
 * shared ingredient across recipes save anything.
 *
 * Four shapes of tile text are resolvable, all by exact inference rather than
 * estimation, and each errs toward buying too much rather than too little:
 *
 *   "(125 g benötigt)"  + pack "500g"        → 0.25   mass/volume division
 *   "(350 ml benötigt)" + unitQuantity "für 7L" → 0.05 package size off the product tile
 *   "(1 Dose benötigt)" + pack "400g"        → 1      the unit names the package itself
 *   "(6 Stk. benötigt)" + unitQuantity "12 Stück" → 0.5 piece count stated by the pack
 *
 * Spoon units ("1 EL" of a 55g jar) are deliberately NOT converted: dried herbs
 * run ~2 g per tablespoon and salt ~18 g, so any nominal density would
 * under-count by up to 9x and tell the user to buy too little.
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

/** Units that name the package itself, so "1 Dose" is exactly one selling unit. */
const CONTAINER_UNITS =
  /^(dose|dosen|pck|packung|packungen|glas|gl[äa]ser|flasche|flaschen|becher|beutel|t[üu]te|karton|blik|blikje|pak|pakje|pot|potje|zak|zakje|bak|bakje|fles)\.?$/i;

/** Units counting pieces, resolvable only when the pack states how many it holds. */
const PIECE_UNITS = /^(stk|st[üu]ck|stuks|stuk|st)\.?$/i;

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

/**
 * A unit-price string like "€5.38/kg" is not a package size — without this
 * guard it would read as a 5.38 kg package and wildly overstate the pack.
 */
function looksLikePrice(text: string): boolean {
  return /[€$£]|\//.test(text);
}

/** Mass or volume anywhere in a size string: "500g", "1,5 l", "für 7L". */
function findMeasure(text: string | null): Measure | null {
  if (!text || looksLikePrice(text)) return null;
  const match = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i.exec(text);
  return match ? { value: parseNumber(match[1]), unit: match[2] } : null;
}

/** Piece count stated by the package: "12 Stück", "4 stuks". */
function findPieceCount(text: string | null): number | null {
  if (!text || looksLikePrice(text)) return null;
  const match = /(\d+)\s*(stk|st[üu]ck|stuks|stuk|st)\b\.?/i.exec(text);
  if (!match) return null;
  const count = parseInt(match[1], 10);
  return count > 0 ? count : null;
}

/**
 * Fraction of one package this recipe needs, or null when it cannot be derived
 * — no tile text, or a unit with nothing to compare it against ("0.5 Köpfe"
 * with no package size, "1 EL" of a 55g jar). Callers fall back to the
 * ingredient's own `quantity`, which conservatively means a whole package.
 */
export function packageFraction(
  recipeQuantityText: string | null,
  recipePackageSize: string | null,
  unitQuantity: string | null = null
): number | null {
  const needed = parseNeeded(recipeQuantityText);
  if (!needed || !(needed.value > 0)) return null;

  // The unit names the package itself — no division needed.
  if (CONTAINER_UNITS.test(needed.unit)) return needed.value;

  // Pieces only resolve when something states how many the package holds.
  if (PIECE_UNITS.test(needed.unit)) {
    const perPack = findPieceCount(recipePackageSize) ?? findPieceCount(unitQuantity);
    return perPack ? needed.value / perPack : null;
  }

  const neededBase = normalize(needed);
  if (!neededBase) return null;
  // The recipe tile's package size first; the product's unit quantity covers
  // the ingredients whose tile shows no size at all.
  const packBase = normalize(findMeasure(recipePackageSize)) ?? normalize(findMeasure(unitQuantity));
  if (!packBase || neededBase.base !== packBase.base || !(packBase.value > 0)) return null;
  return neededBase.value / packBase.value;
}
