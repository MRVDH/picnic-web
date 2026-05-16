import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { PicnicClientInstance } from "@/lib/picnic-client";

type SendRequestClient = PicnicClientInstance & {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

/** Find all objects in the tree that have a given field name, returning up to 5 examples. */
function findObjectsWithField(obj: unknown, field: string, results: unknown[] = []): unknown[] {
  if (results.length >= 5 || typeof obj !== "object" || obj === null) return results;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      findObjectsWithField(item, field, results);
      if (results.length >= 5) break;
    }
    return results;
  }
  const record = obj as Record<string, unknown>;
  if (field in record) results.push(record);
  for (const value of Object.values(record)) {
    findObjectsWithField(value, field, results);
    if (results.length >= 5) break;
  }
  return results;
}

/** Collect all primitive values for a given field name across the entire tree. */
function collectFieldValues(obj: unknown, field: string, results: unknown[] = []): unknown[] {
  if (typeof obj !== "object" || obj === null) return results;
  if (Array.isArray(obj)) {
    for (const item of obj) collectFieldValues(item, field, results);
    return results;
  }
  const record = obj as Record<string, unknown>;
  if (field in record && typeof record[field] !== "object") results.push(record[field]);
  for (const value of Object.values(record)) collectFieldValues(value, field, results);
  return results;
}

/** Collect all OPEN action targets in a Fusion page tree. */
function collectOpenTargets(obj: unknown, results: string[] = []): string[] {
  if (typeof obj !== "object" || obj === null) return results;
  if (Array.isArray(obj)) {
    for (const item of obj) collectOpenTargets(item, results);
    return results;
  }
  const record = obj as Record<string, unknown>;
  const onPress = record.onPress as Record<string, unknown> | undefined;
  if (onPress?.actionType === "OPEN" && typeof onPress.target === "string") {
    results.push(onPress.target as string);
  }
  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) collectOpenTargets(value, results);
  }
  return results;
}

/** DEBUG: Dumps raw Fusion pages.
 *  ?category=<pageId>              → client.app.getPage(pageId)
 *  ?recipe=<24-char-hex>           → getRecipeDetailsPage (uses recipe-details-page-root)
 *  ?path=<url-encoded-path>        → raw sendRequest GET to any path
 *  ?open-targets=<pageId>          → list all OPEN action targets in a category page
 *  (no params)                     → editorial homepage */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = readAuthToken(request);
  if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

  const countryCode = readCountryCode(request);
  const client = buildPicnicClient(token, countryCode) as unknown as SendRequestClient;
  const categoryId = request.nextUrl.searchParams.get("category");
  const recipeId = request.nextUrl.searchParams.get("recipe");
  const rawPath = request.nextUrl.searchParams.get("path");
  const openTargetsCategoryId = request.nextUrl.searchParams.get("open-targets");
  const searchField = request.nextUrl.searchParams.get("search-field");
  const fieldValues = request.nextUrl.searchParams.get("field-values");

  let rawPage: unknown;
  try {
    if (openTargetsCategoryId) {
      const page = await (client as unknown as PicnicClientInstance).app.getPage(openTargetsCategoryId);
      const targets = [...new Set(collectOpenTargets(page))];
      return NextResponse.json({ targets });
    } else if (rawPath && fieldValues) {
      rawPage = await client.sendRequest("GET", rawPath, null, true);
      const values = collectFieldValues(rawPage, fieldValues);
      return NextResponse.json({ field: fieldValues, count: values.length, values });
    } else if (rawPath && searchField) {
      rawPage = await client.sendRequest("GET", rawPath, null, true);
      const examples = findObjectsWithField(rawPage, searchField);
      return NextResponse.json({ field: searchField, examples });
    } else if (rawPath) {
      rawPage = await client.sendRequest("GET", rawPath, null, true);
    } else if (recipeId) {
      rawPage = await (client as unknown as PicnicClientInstance).recipe.getRecipeDetailsPage(recipeId);
    } else if (categoryId) {
      rawPage = await (client as unknown as PicnicClientInstance).app.getPage(categoryId);
    } else {
      rawPage = await (client as unknown as PicnicClientInstance).recipe.getRecipesPage();
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  return NextResponse.json(rawPage);
}
