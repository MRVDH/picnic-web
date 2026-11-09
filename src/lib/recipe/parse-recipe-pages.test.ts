import { describe, expect, it } from "vitest";

import { fusionPage, recipeTile } from "@/test/picnic-fake";

import { parseRecipeTiles } from "./parse-recipe-pages";

const ID = "a".repeat(24);

describe("parseRecipeTiles", () => {
  it.each([
    [["25 min"], 25],
    [["Vegan", "15 + 25 min"], 40],
    [["1 Std 10 min"], 70],
    [["1 uur"], 60],
    [["Vegan"], null],
  ])("reads the cooking time from the tags %j", (tags, minutes) => {
    const [recipe] = parseRecipeTiles(
      fusionPage("p", [recipeTile({ id: ID, name: "Suppe", tags })])
    );
    expect(recipe.cookingTimeMinutes).toBe(minutes);
  });

  it("takes the name from the tile text when the analytics carry none", () => {
    const tile = recipeTile({ id: ID, name: "Gemüsepfanne" });
    tile.analytics.contexts = [
      {
        schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-0-0",
        data: { recipe_id: ID },
      },
    ];

    expect(parseRecipeTiles(fusionPage("p", [tile]))[0].name).toBe("Gemüsepfanne");
  });

  it("ignores tiles without a recipe and lists a recipe once", () => {
    const page = fusionPage("p", [
      { type: "PML", id: "banner", pml: { component: { type: "RICH_TEXT", markdown: "Neu" } } },
      recipeTile({ id: ID, name: "Suppe" }),
      { type: "BLOCK", id: "row", children: [recipeTile({ id: ID, name: "Suppe" })] },
    ]);

    expect(parseRecipeTiles(page)).toEqual([
      { id: ID, name: "Suppe", imageId: `img-${ID}`, cookingTimeMinutes: null },
    ]);
  });
});
