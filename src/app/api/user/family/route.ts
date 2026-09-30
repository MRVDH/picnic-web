import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { FamilyApiResponse } from "@/lib/core/user-types";
import { parseFamilyPage } from "@/lib/user/parse-family-page";

/** The app's Mijn Family-account page. */
const FAMILY_PAGE_ID = "my-family-account";

/**
 * GET /api/user/family
 *
 * Returns the Mijn Family-account page: what the membership saved, its
 * benefits and the current plan, with Picnic's texts.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<FamilyApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(FAMILY_PAGE_ID);

    return NextResponse.json(parseFamilyPage(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/user/family] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load the Family account. Please try again later." },
      { status: 502 }
    );
  }
}
