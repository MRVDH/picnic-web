import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCookbookPage } from "@/lib/parse-cookbook";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, CookbookApiResponse } from "@/lib/types";

type SendRequestClient = {
  sendRequest: (method: string, path: string, body: unknown, fusion: boolean) => Promise<unknown>;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<CookbookApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ categories: [], recipes: [] });
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);
    const path = `/pages/search-page-results?search_term=${encodeURIComponent(q)}&page_context=MEALS&is_recipe=true`;
    const rawPage = await (client as unknown as SendRequestClient).sendRequest(
      "GET",
      path,
      null,
      true
    );
    const recipes = parseCookbookPage(rawPage);
    return NextResponse.json({ categories: [], recipes });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cookbook/search] Failed:", message);
    return NextResponse.json(
      { error: "Failed to search recipes. Please try again later." },
      { status: 502 }
    );
  }
}
