import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  categoryContentPageId,
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

import { GET } from "./route";

const PASTA = "11111111-0000-4000-8000-000000000001";
const SUPPEN = "11111111-0000-4000-8000-000000000002";

const specs = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${String(i).padStart(23, "0")}`,
    name: `Rezept ${prefix}${i}`,
  }));

const home = cookbookHomePage(
  [{ title: "Beliebt", recipes: [{ id: "a".repeat(24), name: "Linsensuppe" }] }],
  [
    {
      section: "Kategorien",
      links: [
        { type: "category", id: PASTA, name: "Thermomix" },
        { type: "category", id: SUPPEN, name: "Neuheiten" },
        { type: "group", id: "Kids", name: "Kids" },
      ],
    },
  ]
);

let token: string;

beforeEach(() => {
  token = freshToken();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/cookbook/counts", () => {
  it("answers 401 without a token", async () => {
    expect((await GET(apiRequest("/api/cookbook/counts"))).status).toBe(401);
  });

  it("counts the featured, saved, category and group recipes as Picnic DE serves them", async () => {
    stubPicnicPages({
      "meals-page-root": home,
      "saved-deep-dive-page-content": fusionPage(
        "saved",
        specs("b", 2).map((r) => recipeTile(r))
      ),
      ...categoryPages(PASTA, specs("c", 3)),
      ...categoryPages(SUPPEN, specs("d", 4)),
      [groupPageId("Kids")]: groupPage("Kids", [
        { id: PASTA, name: "Pasta" },
        { id: SUPPEN, name: "Suppen" },
      ]),
    });

    const res = await GET(apiRequest("/api/cookbook/counts", { token }));

    expect(await res.json()).toEqual({
      __featured__: 1,
      __saved__: 2,
      [`category:${PASTA}`]: 3,
      [`category:${SUPPEN}`]: 4,
      "group:Kids": 7,
    });
  });

  it("counts a category that fails as 0 and still counts the others", async () => {
    stubPicnicPages({
      "meals-page-root": home,
      "saved-deep-dive-page-content": fusionPage("saved", []),
      [categoryContentPageId(PASTA)]: errorResponse(500),
      ...categoryPages(SUPPEN, specs("d", 4)),
      [groupPageId("Kids")]: groupPage("Kids", [{ id: SUPPEN, name: "Suppen" }]),
    });

    const res = await GET(apiRequest("/api/cookbook/counts", { token }));

    expect(await res.json()).toMatchObject({
      [`category:${PASTA}`]: 0,
      [`category:${SUPPEN}`]: 4,
      "group:Kids": 4,
    });
  });

  it("asks Picnic again next time when every count came back empty", async () => {
    const pages: Record<string, unknown> = {
      "meals-page-root": cookbookHomePage([], []),
      "saved-deep-dive-page-content": fusionPage("saved", []),
    };
    const { requested } = stubPicnicPages(pages);

    await GET(apiRequest("/api/cookbook/counts", { token }));
    const firstRound = requested.length;
    await GET(apiRequest("/api/cookbook/counts", { token }));

    expect(requested.length).toBeGreaterThan(firstRound);
  });
});
