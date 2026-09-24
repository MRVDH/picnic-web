import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ParcelDetailApiResponse } from "@/lib/core/delivery-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import { parseParcelDetailPage } from "@/lib/delivery/parse-parcels-page";

/** The app's tracking page for one parcel. */
const PARCEL_TRACKING_PAGE_ID = "parcel-tracking-page-root";

/**
 * GET /api/parcels/[parcelId]
 *
 * Returns one parcel's tracking page (parcel-tracking-page-root): title,
 * shipment number and the tracking steps, with Picnic's localized texts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ parcelId: string }> }
): Promise<NextResponse<ParcelDetailApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const { parcelId } = await params;

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(
      `${PARCEL_TRACKING_PAGE_ID}?parcel_id=${encodeURIComponent(parcelId)}`
    );

    return NextResponse.json(parseParcelDetailPage(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/parcels/${parcelId}] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load the parcel. Please try again later." },
      { status: 502 }
    );
  }
}
