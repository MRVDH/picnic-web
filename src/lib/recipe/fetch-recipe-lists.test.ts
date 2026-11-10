import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPicnicClient } from "@/lib/core/picnic-client";
import {
  categoryContentPageId,
  categoryPageId,
  categoryPages,
  cookbookHomePage,
  errorResponse,
  freshToken,
  fusionPage,
  groupPage,
  groupPageId,
  recipeTile,
  stubPicnicPages,
} from "@/test/picnic-fake";

import {
  CATEGORY_KEY_RE,
  fetchCategoryRecipes,
  fetchRecipeOverview,
  fetchSavedRecipes,
} from "./fetch-recipe-lists";

const client = () => buildPicnicClient(freshToken(), "DE");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRecipeOverview", () => {
  it("lists the recipes of every row once, in row order", async () => {
    stubPicnicPages({
      "meals-page-root": cookbookHomePage(
        [
          {
            title: "Beliebt",
            recipes: [
              { id: "a".repeat(24), name: "Linsensuppe", tags: ["20 min"] },
              { id: "b".repeat(24), name: "Ofengemüse" },
            ],
          },
          {
            title: "Neu",
            recipes: [
              { id: "b".repeat(24), name: "Ofengemüse" },
              { id: "c".repeat(24), name: "Pilzrisotto", tags: ["1 Std 10 min"] },
            ],
          },
        ],
        []
      ),
    });

    const { recipes } = await fetchRecipeOverview(client(), "DE");

    expect(recipes).toEqual([
      {
        id: "a".repeat(24),
        name: "Linsensuppe",
        imageId: `img-${"a".repeat(24)}`,
        cookingTimeMinutes: 20,
      },
      {
        id: "b".repeat(24),
        name: "Ofengemüse",
        imageId: `img-${"b".repeat(24)}`,
        cookingTimeMinutes: null,
      },
      {
        id: "c".repeat(24),
        name: "Pilzrisotto",
        imageId: `img-${"c".repeat(24)}`,
        cookingTimeMinutes: 70,
      },
    ]);
  });

  it("keys categories and groups so the cookbook route accepts them, each once", async () => {
    stubPicnicPages({
      "meals-page-root": cookbookHomePage(
        [],
        [
          {
            section: "Kategorien",
            links: [
              { type: "category", id: "11111111-2222-3333-4444-555555555555", name: "Thermomix" },
              { type: "group", id: "Burger & Sandwich", name: "Burger & Sandwich" },
            ],
          },
          {
            section: "Anlässe",
            links: [
              { type: "category", id: "11111111-2222-3333-4444-555555555555", name: "Thermomix" },
            ],
          },
        ]
      ),
    });

    const { categories } = await fetchRecipeOverview(client(), "DE");

    expect(categories).toEqual([
      { id: "category:11111111-2222-3333-4444-555555555555", name: "Thermomix" },
      { id: "group:Burger & Sandwich", name: "Burger & Sandwich" },
    ]);
    for (const category of categories) expect(category.id).toMatch(CATEGORY_KEY_RE);
  });
});

describe("fetchRecipeOverview on Picnic DE", () => {
  const home = cookbookHomePage(
    [],
    [
      {
        section: "Leicht gemacht",
        links: [
          { type: "category", id: "11111111-0000-4000-8000-000000000001", name: "Blitzrezepte" },
          { type: "category", id: "11111111-0000-4000-8000-000000000002", name: "Thermomix" },
          { type: "group", id: "Salate", name: "Salate" },
        ],
      },
    ]
  );

  // Picnic DE's category pages stop at 500 recipes; the pages the cookbook read before
  // (recipe-cattree-*) list every recipe, e.g. 1211 for Blitzrezepte.
  it("links the categories that have a full recipe-cattree page to it, not the groups", async () => {
    stubPicnicPages({ "meals-page-root": home });

    const { categories } = await fetchRecipeOverview(client(), "DE");

    expect(categories).toEqual([
      { id: "legacy:recipe-cattree-25min", name: "Blitzrezepte" },
      { id: "category:11111111-0000-4000-8000-000000000002", name: "Thermomix" },
      { id: "group:Salate", name: "Salate" },
    ]);
    for (const category of categories) expect(category.id).toMatch(CATEGORY_KEY_RE);
  });

  it("keeps Picnic's categories in other countries", async () => {
    stubPicnicPages({ "meals-page-root": home });

    const { categories } = await fetchRecipeOverview(client(), "NL");

    expect(categories.map((c) => c.id)).toEqual([
      "category:11111111-0000-4000-8000-000000000001",
      "category:11111111-0000-4000-8000-000000000002",
      "group:Salate",
    ]);
  });
});

describe("fetchSavedRecipes", () => {
  it("lists the recipes of the saved recipes page", async () => {
    stubPicnicPages({
      "saved-deep-dive-page-content": fusionPage("saved", [
        recipeTile({ id: "d".repeat(24), name: "Gemüsecurry", tags: ["35 min"] }),
      ]),
    });

    expect(await fetchSavedRecipes(client())).toEqual([
      {
        id: "d".repeat(24),
        name: "Gemüsecurry",
        imageId: `img-${"d".repeat(24)}`,
        cookingTimeMinutes: 35,
      },
    ]);
  });
});

describe("fetchCategoryRecipes", () => {
  const PASTA = "9a8ef2b5-0000-4000-8000-000000000001";
  const FESTMAHL = "75d966f3-0000-4000-8000-000000000002";
  const PLAETZCHEN = "efe6af78-0000-4000-8000-000000000003";
  const item = (id: string, name: string, minutes: number | null) => ({
    id,
    name,
    imageId: `img-${id}`,
    cookingTimeMinutes: minutes,
  });

  // Picnic DE serves meals-category-page as a Fusion shell; the recipes are on its content page.
  it("reads the recipes of a category from its content page", async () => {
    stubPicnicPages(
      categoryPages(PASTA, [
        { id: "e".repeat(24), name: "Gnocchi mit Käsesoße", tags: ["20 Min.", "Kids-Hit"] },
        { id: "f".repeat(24), name: "Lasagne", tags: ["50 Min."] },
      ])
    );

    expect(await fetchCategoryRecipes(client(), `category:${PASTA}`)).toEqual([
      item("e".repeat(24), "Gnocchi mit Käsesoße", 20),
      item("f".repeat(24), "Lasagne", 50),
    ]);
  });

  it("follows the category page to its content page, as the app does", async () => {
    const { requested } = stubPicnicPages(
      categoryPages(PASTA, [{ id: "e".repeat(24), name: "Gnocchi" }])
    );

    await fetchCategoryRecipes(client(), `category:${PASTA}`);

    expect(requested).toEqual([categoryPageId(PASTA), categoryContentPageId(PASTA)]);
  });

  it("reads the recipes of a group's categories, each recipe once", async () => {
    stubPicnicPages({
      [groupPageId("Weihnachten")]: groupPage("Weihnachten", [
        { id: FESTMAHL, name: "Festmahl" },
        { id: PLAETZCHEN, name: "Plätzchen" },
      ]),
      ...categoryPages(FESTMAHL, [
        { id: "1".repeat(24), name: "Gänsebraten", tags: ["1 Std 10 min"] },
        { id: "2".repeat(24), name: "Rotkohl" },
      ]),
      ...categoryPages(PLAETZCHEN, [
        { id: "3".repeat(24), name: "Vanillekipferl", tags: ["45 Min."] },
        { id: "2".repeat(24), name: "Rotkohl" },
      ]),
    });

    expect(await fetchCategoryRecipes(client(), "group:Weihnachten")).toEqual([
      item("1".repeat(24), "Gänsebraten", 70),
      item("2".repeat(24), "Rotkohl", null),
      item("3".repeat(24), "Vanillekipferl", 45),
    ]);
  });

  it("reads every recipe of a recipe-cattree page, beyond 500, with one request", async () => {
    const recipes = Array.from({ length: 1211 }, (_, i) => ({
      id: i.toString(16).padStart(24, "0"),
      name: `Rezept ${i}`,
    }));
    const { requested } = stubPicnicPages({
      "recipe-cattree-25min": fusionPage(
        "recipe-cattree-25min",
        recipes.map((r) => recipeTile(r))
      ),
    });

    const result = await fetchCategoryRecipes(client(), "legacy:recipe-cattree-25min");

    expect(result).toHaveLength(1211);
    expect(requested).toEqual(["recipe-cattree-25min"]);
  });

  it("does not ask again after Picnic rejects the request", async () => {
    const { requested } = stubPicnicPages({ [categoryPageId(PASTA)]: errorResponse(403) });

    await expect(fetchCategoryRecipes(client(), `category:${PASTA}`)).rejects.toMatchObject({
      status: 403,
    });
    expect(requested).toHaveLength(1);
  });
});
