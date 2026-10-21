import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient, getRscPageContent } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { RscPageApiResponse } from "@/lib/rsc/rsc-page-types";

/**
 * GET /api/rsc-pages?pageId=<id>
 *
 * Fetches a page Picnic serves as a React Server Components payload (e.g.
 * category-tree-root, the app's search tab) and returns its theme tokens and
 * section components for the web renderer registry.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<RscPageApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const pageId = request.nextUrl.searchParams.get("pageId");
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);
    return NextResponse.json(await getRscPageContent(client, pageId));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/rsc-pages] Failed to fetch page:", message);

    return NextResponse.json(
      { error: "Failed to load the page. Please try again later." },
      { status: 502 }
    );
  }
}
