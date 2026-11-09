import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  errorResponse,
  freshToken,
  fusionPage,
  recipeTile,
  stubPicnicPages,
} from "@/test/picnic-fake";

import { GET } from "./route";

const searchPageId = (q: string) =>
  `search-page-results?search_term=${q}&page_context=MEALS&is_recipe=true`;

/** The recipe search results page as Picnic DE serves it (Fusion). */
const searchResults = (tiles: unknown[]) =>
  fusionPage("search-page-results", [
    {
      type: "BLOCK",
      id: "searchState",
      state: { selectedEntityType: "RECIPE", analyticsTemplate: { data: {} } },
    },
    ...tiles,
  ]);

let token: string;

beforeEach(() => {
  token = freshToken();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/cookbook/search", () => {
  it("answers 401 TOKEN_EXPIRED without a token", async () => {
    const res = await GET(apiRequest("/api/cookbook/search?q=pasta"));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("returns no recipes for a blank query without calling Picnic", async () => {
    const { requested } = stubPicnicPages({});

    const res = await GET(apiRequest("/api/cookbook/search?q=%20%20", { token }));

    expect(await res.json()).toEqual({ categories: [], recipes: [] });
    expect(requested).toEqual([]);
  });

  it("returns the matching recipes with their cooking time", async () => {
    stubPicnicPages({
      [searchPageId("curry")]: searchResults([
        recipeTile({ id: "a".repeat(24), name: "Gemüsecurry", tags: ["25 min", "Vegan"] }),
        recipeTile({ id: "b".repeat(24), name: "Linsencurry", tags: ["Vegan", "15 + 25 min"] }),
        recipeTile({ id: "c".repeat(24), name: "Curry-Eintopf", tags: ["1 Std 10 min"] }),
      ]),
    });

    const res = await GET(apiRequest("/api/cookbook/search?q=curry", { token }));

    expect(await res.json()).toEqual({
      categories: [],
      recipes: [
        {
          id: "a".repeat(24),
          name: "Gemüsecurry",
          imageId: `img-${"a".repeat(24)}`,
          cookingTimeMinutes: 25,
        },
        {
          id: "b".repeat(24),
          name: "Linsencurry",
          imageId: `img-${"b".repeat(24)}`,
          cookingTimeMinutes: 40,
        },
        {
          id: "c".repeat(24),
          name: "Curry-Eintopf",
          imageId: `img-${"c".repeat(24)}`,
          cookingTimeMinutes: 70,
        },
      ],
    });
  });

  it("answers 502 when Picnic fails", async () => {
    stubPicnicPages({ [searchPageId("curry")]: errorResponse(500) });

    expect((await GET(apiRequest("/api/cookbook/search?q=curry", { token }))).status).toBe(502);
  });
});
