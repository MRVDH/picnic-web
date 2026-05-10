import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";

type AnyRecord = Record<string, unknown>;

/** Collect all TOUCHABLE nodes and their onPress targets from a Fusion page tree. */
function collectTouchables(obj: unknown, results: AnyRecord[] = []): AnyRecord[] {
  if (typeof obj !== "object" || obj === null) return results;
  if (Array.isArray(obj)) {
    for (const item of obj) collectTouchables(item, results);
    return results;
  }
  const record = obj as AnyRecord;
  if (record.type === "TOUCHABLE") {
    results.push({
      id: record.id,
      onPress: record.onPress,
    });
  }
  for (const value of Object.values(record)) collectTouchables(value, results);
  return results;
}

/**
 * DEBUG: Inspect the cookbook Fusion page structure.
 * ?raw=1          → dump the entire raw page (default)
 * ?touchables=1   → dump all TOUCHABLE nodes and their onPress targets
 * ?category=<id>  → use that category page instead of meals-page-root
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = readAuthToken(request);
  if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

  const countryCode = readCountryCode(request);
  const client = buildPicnicClient(token, countryCode);
  const categoryId = request.nextUrl.searchParams.get("category");
  const touchablesOnly = request.nextUrl.searchParams.has("touchables");

  const rawPage = categoryId
    ? await client.app.getPage(categoryId)
    : await client.recipe.getRecipesPage();

  if (touchablesOnly) {
    const touchables = collectTouchables(rawPage);
    return NextResponse.json({ count: touchables.length, touchables });
  }

  return NextResponse.json(rawPage);
}
