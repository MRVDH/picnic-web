import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";

/** DEBUG: Dumps the raw Fusion page for the cookbook/meals page. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = readAuthToken(request);
  if (!token) return NextResponse.json({ error: "No auth token" }, { status: 401 });

  const countryCode = readCountryCode(request);
  const client = buildPicnicClient(token, countryCode);
  const rawPage = await client.recipe.getRecipesPage();
  return NextResponse.json(rawPage);
}
