import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";

/** DEBUG: Dumps the raw Fusion page for the cookbook/meals or a category page.
 *  Add ?category=recipe-cattree-xxx to dump that category's page instead. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = readAuthToken(request);
  if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

  const countryCode = readCountryCode(request);
  const client = buildPicnicClient(token, countryCode);
  const categoryId = request.nextUrl.searchParams.get("category");

  const rawPage = categoryId
    ? await client.app.getPage(categoryId)
    : await client.recipe.getRecipesPage();

  return NextResponse.json(rawPage);
}
