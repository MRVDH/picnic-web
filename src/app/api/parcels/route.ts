import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ParcelsApiResponse } from "@/lib/core/delivery-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import { parseParcelsPage } from "@/lib/delivery/parse-parcels-page";

/** The app's Pakketservice page. */
const PARCELS_PAGE_ID = "parcels-overview-page-root";

/**
 * GET /api/parcels
 *
 * Returns the Pakketservice page (parcels-overview-page-root): its title,
 * subtitle, parcel sections and bottom action, with Picnic's localized texts.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ParcelsApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(PARCELS_PAGE_ID);

    return NextResponse.json(parseParcelsPage(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/parcels] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load parcels. Please try again later." },
      { status: 502 }
    );
  }
}
