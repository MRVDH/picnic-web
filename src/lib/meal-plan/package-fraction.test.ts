import { describe, expect, it } from "vitest";

import { packageFraction } from "./package-fraction";

describe("packageFraction", () => {
  it.each([
    // mass and volume against the package size
    ["(125 g benötigt)", "500g", 0.25],
    ["(1,5 kg benötigt)", "500 g", 3],
    ["(350 ml benötigt)", "für 7L", 0.05],
    ["(100 ml nodig)", "1 l", 0.1],
    // units that name the package itself
    ["(1 Dose benötigt)", "400g", 1],
    ["(2 Packungen benötigt)", "250 g", 2],
    // pieces, when the package states its count
    ["(6 Stk. benötigt)", "12 Stück", 0.5],
    // spoons: exact against volume, capped high (25 g per EL) against weight
    ["(2 EL benötigt)", "250 ml", 0.12],
    ["(1 EL benötigt)", "100 g", 0.25],
  ])("%s of a %s package is %s", (needed, unitQuantity, fraction) => {
    expect(packageFraction(needed, unitQuantity)).toBeCloseTo(fraction, 10);
  });

  it.each([
    ["no tile text", null, "500g"],
    ["pieces without a count on the package", "(2 Stk. benötigt)", "500 g"],
    ["a unit with nothing to compare against", "(0.5 Köpfe benötigt)", "1 Stück"],
    ["mass against a volume", "(200 g benötigt)", "1 l"],
    ["a unit price instead of a size", "(200 g benötigt)", "€5.38/kg"],
    ["a zero amount", "(0 g benötigt)", "500 g"],
  ])("is unknown for %s", (_case, needed, unitQuantity) => {
    expect(packageFraction(needed, unitQuantity)).toBeNull();
  });
});
