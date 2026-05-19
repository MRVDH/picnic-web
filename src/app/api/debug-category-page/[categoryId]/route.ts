import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";

const L2_PAGE_PREFIX = "L2-category-page-root?category_id=";

/**
 * DEBUG: Dumps the raw FusionPage response for an L2 category page.
 * GET /api/debug-category-page/{categoryId}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
): Promise<NextResponse> {
  const { categoryId } = await params;
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json({ error: "No auth token" }, { status: 401 });
  }

  const countryCode = readCountryCode(request);

  const client = buildPicnicClient(token, countryCode);
  const rawPage = await client.app.getPage(`${L2_PAGE_PREFIX}${categoryId}`);

  return NextResponse.json(rawPage);
}
