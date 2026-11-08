// Test helpers: a stand-in for Picnic's HTTP API and builders for the Fusion pages the cookbook
// reads. The real picnic-api client runs against them, so its format checks and parsers are part
// of every test. All ids and names are made up.
import { NextRequest } from "next/server";

import { vi } from "vitest";

const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-0-0";
const AISLE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/aisle/jsonschema/1-0-0";
const PAGE_SECTION_SCHEMA = "iglu:tech.picnic.snowplow.analytics/page_section/jsonschema/1-0-0";
const PML_COMPONENT_SCHEMA = "iglu:tech.picnic.snowplow.analytics/pml_component/jsonschema/1-0-0";

type PageResponse = unknown | (() => Response);

/**
 * Answers `/pages/<id>` requests from `pages`, keyed by the decoded page id with its query
 * (`meals-category-page?category_id=…`). A value is served as JSON, which picnic-api reads as a
 * Fusion page; a function returns its own Response. Unknown pages answer 404.
 */
export function stubPicnicPages(pages: Record<string, PageResponse>): { requested: string[] } {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const match = url.pathname.match(/\/pages\/(.+)$/);
      const pageId = match ? decodeURIComponent(match[1]) + decodeURIComponent(url.search) : "";
      requested.push(pageId);
      const page = pages[pageId];
      if (page === undefined) return new Response("not found", { status: 404 });
      if (typeof page === "function") return (page as () => Response)();
      return Response.json(page);
    })
  );
  return { requested };
}

let tokenCounter = 0;

/** A token no other test uses, so the server-side caches never carry results across tests. */
export function freshToken(): string {
  tokenCounter += 1;
  return `test-token-${tokenCounter}-${Math.random().toString(36).slice(2)}`;
}

/** A GET request to a route, with the auth and country cookies the app sets. */
export function apiRequest(
  path: string,
  { token, country = "DE" }: { token?: string | null; country?: string } = {}
): NextRequest {
  const cookies = [`picnic_country=${country}`];
  if (token) cookies.push(`picnic_auth_token=${token}`);
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { cookie: cookies.join("; ") },
  });
}

export type TileSpec = { id: string; name: string; imageId?: string; tags?: string[] };

/** A recipe tile as Fusion pages show it: image, name, then tags such as "20 min". */
export function recipeTile(
  { id, name, imageId = `img-${id}`, tags = [] }: TileSpec,
  extraContexts: unknown[] = []
) {
  return {
    type: "PML",
    id: `recipe-tile-${id}`,
    analytics: {
      contexts: [
        { schema: RECIPE_SCHEMA, data: { recipe_id: id, recipe_name: name } },
        ...extraContexts,
      ],
    },
    pml: {
      component: {
        type: "STACK",
        children: [
          { type: "IMAGE", source: { id: imageId } },
          { type: "RICH_TEXT", markdown: name, textType: "SUBTITLE1" },
          ...tags.map((tag) => ({ type: "RICH_TEXT", markdown: tag })),
        ],
      },
    },
  };
}

/** A Fusion page whose body lists `children`. */
export function fusionPage(id: string, children: unknown[]) {
  return { id, header: { title: id }, body: { type: "BLOCK", id: `${id}-body`, children } };
}

export type LinkSpec = { type: "category" | "group"; id: string; name: string };

/** A link of the cookbook home's category tree, under the heading `section`. */
export function categoryLinkNode({ type, id, name }: LinkSpec, section: string) {
  const deeplink =
    type === "category"
      ? `picnic://pages?id=meals-category-page,category_id=${encodeURIComponent(id)}`
      : `picnic://pages?id=meals-category-group-page,group_name=${encodeURIComponent(id)}`;
  return {
    type: "PML",
    id: `category-link-${id}`,
    analytics: {
      contexts: [
        { schema: PML_COMPONENT_SCHEMA, data: { deeplink } },
        { schema: PAGE_SECTION_SCHEMA, data: { name: section } },
      ],
    },
    pml: {
      component: {
        type: "STACK",
        accessibilityLabel: name,
        children: [{ type: "RICH_TEXT", markdown: name }],
      },
    },
  };
}

/**
 * The cookbook home (`meals-page-root`): rows of recipes, then the category tree. Each row is
 * `{ title, recipes }`; links are grouped under their section heading.
 */
export function cookbookHomePage(
  rows: { title: string; recipes: TileSpec[] }[],
  links: { section: string; links: LinkSpec[] }[]
) {
  return fusionPage("meals-page-root", [
    ...rows.flatMap((row, rank) =>
      row.recipes.map((recipe) =>
        recipeTile(recipe, [
          {
            schema: AISLE_SCHEMA,
            data: { assortment_aisle: row.title, aisle_ranking: rank, pill_display_name: null },
          },
        ])
      )
    ),
    ...links.flatMap(({ section, links: sectionLinks }) =>
      sectionLinks.map((link) => categoryLinkNode(link, section))
    ),
  ]);
}

/** The page id of a category: a shell that loads its content page (SUSPENSE). */
export const categoryPageId = (categoryId: string) =>
  `meals-category-page?category_id=${categoryId}`;

/** The page id of a category's recipes. */
export const categoryContentPageId = (categoryId: string) =>
  `meals-category-page-content?category_id=${categoryId}`;

/** The page id of a category group. */
export const groupPageId = (groupName: string) =>
  `meals-category-group-page?group_name=${groupName}`;

/**
 * A category as Picnic DE serves it (Fusion): the shell, which has no recipes and points to its
 * content page, and the content page with the recipe tiles.
 */
export function categoryPages(categoryId: string, recipes: TileSpec[]) {
  return {
    [categoryPageId(categoryId)]: fusionPage("meals-category-page", [
      {
        type: "SUSPENSE",
        id: "meals-category-page-suspense",
        child: null,
        pageConfig: { id: "meals-category-page-content", parameters: { category_id: categoryId } },
      },
    ]),
    [categoryContentPageId(categoryId)]: fusionPage(
      "meals-category-page-content",
      recipes.map((recipe) => recipeTile(recipe))
    ),
  };
}

/**
 * A category group as Picnic DE serves it (Fusion): a list of links to its categories, each a
 * list item whose analytics carry the deep link.
 */
export function groupPage(groupName: string, categories: { id: string; name: string }[]) {
  return fusionPage(
    "meals-category-group-page",
    categories.map(({ id, name }) => {
      const deeplink = `app.picnic://store/page;id=meals-category-page,category_id=${id}`;
      return {
        type: "PML",
        id: `list-item-${id}`,
        analytics: {
          contexts: [
            {
              schema: PML_COMPONENT_SCHEMA,
              data: { type: "list_item", deeplink, template_id: "core-list-item-template" },
            },
            {
              schema: PAGE_SECTION_SCHEMA,
              data: { type: "meals_category_group_page", name: groupName },
            },
          ],
        },
        pml: {
          component: {
            type: "TOUCHABLE",
            accessibilityLabel: name,
            onPress: { actionType: "OPEN", target: deeplink },
            child: { type: "STACK", children: [{ type: "RICH_TEXT", markdown: name }] },
          },
        },
      };
    })
  );
}

/** A Picnic error response, e.g. 401 for an expired token. */
export const errorResponse =
  (status: number, body: unknown = { error: { code: "ERROR" } }) =>
  () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
