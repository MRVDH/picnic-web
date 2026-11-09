import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  categoryPages,
  cookbookHomePage,
  errorResponse,
  freshToken,
  fusionPage,
  recipeTile,
  stubPicnicPages,
} from "@/test/picnic-fake";

import { GET } from "./route";

const CATEGORY_ID = "7fe9af69-0000-4000-8000-000000000002";
let token: string;

beforeEach(() => {
  token = freshToken();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/cookbook", () => {
  it("answers 401 TOKEN_EXPIRED without a token", async () => {
    const res = await GET(apiRequest("/api/cookbook"));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("returns the featured recipes and the categories without a category", async () => {
    stubPicnicPages({
      "meals-page-root": cookbookHomePage(
        [{ title: "Beliebt", recipes: [{ id: "a".repeat(24), name: "Linsensuppe" }] }],
        [
          {
            section: "Kategorien",
            links: [{ type: "category", id: CATEGORY_ID, name: "Thermomix" }],
          },
        ]
      ),
    });

    const res = await GET(apiRequest("/api/cookbook", { token }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      recipes: [
        {
          id: "a".repeat(24),
          name: "Linsensuppe",
          imageId: `img-${"a".repeat(24)}`,
          cookingTimeMinutes: null,
        },
      ],
      categories: [{ id: `category:${CATEGORY_ID}`, name: "Thermomix" }],
    });
  });

  it("returns the recipes of a category as Picnic DE serves it", async () => {
    stubPicnicPages({
      ...categoryPages(CATEGORY_ID, [
        { id: "b".repeat(24), name: "Penne Arrabbiata", tags: ["20 Min."] },
      ]),
    });

    const res = await GET(
      apiRequest(`/api/cookbook?category=${encodeURIComponent(`category:${CATEGORY_ID}`)}`, {
        token,
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      categories: [],
      recipes: [
        {
          id: "b".repeat(24),
          name: "Penne Arrabbiata",
          imageId: `img-${"b".repeat(24)}`,
          cookingTimeMinutes: 20,
        },
      ],
    });
  });

  it("returns the saved recipes for __saved__", async () => {
    stubPicnicPages({
      "saved-deep-dive-page-content": fusionPage("saved", [
        recipeTile({ id: "c".repeat(24), name: "Gemüsecurry" }),
      ]),
    });

    const res = await GET(apiRequest("/api/cookbook?category=__saved__", { token }));

    expect((await res.json()).recipes.map((r: { id: string }) => r.id)).toEqual(["c".repeat(24)]);
  });

  it("returns the recipes of a recipe-cattree page", async () => {
    stubPicnicPages({
      "recipe-cattree-pasta": fusionPage("recipe-cattree-pasta", [
        recipeTile({ id: "d".repeat(24), name: "Pasta al Limone" }),
      ]),
    });

    const res = await GET(
      apiRequest("/api/cookbook?category=legacy%3Arecipe-cattree-pasta", { token })
    );

    expect((await res.json()).recipes.map((r: { id: string }) => r.id)).toEqual(["d".repeat(24)]);
  });

  it.each([
    "recipe-cattree-pasta",
    "legacy:meals-page-root",
    "legacy:recipe-cattree-a/b",
    "category:../../user",
    "group:a/b",
  ])("rejects the category id %s without calling Picnic", async (category) => {
    const { requested } = stubPicnicPages({});

    const res = await GET(
      apiRequest(`/api/cookbook?category=${encodeURIComponent(category)}`, { token })
    );

    expect(res.status).toBe(400);
    expect(requested).toEqual([]);
  });

  it("answers 401 TOKEN_EXPIRED when Picnic rejects the token", async () => {
    stubPicnicPages({ "meals-page-root": errorResponse(401) });

    const res = await GET(apiRequest("/api/cookbook", { token }));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("answers 502 when Picnic fails otherwise", async () => {
    stubPicnicPages({ "meals-page-root": errorResponse(500) });

    const res = await GET(apiRequest("/api/cookbook", { token }));

    expect(res.status).toBe(502);
  });
});
