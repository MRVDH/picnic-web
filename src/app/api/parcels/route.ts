import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { ParcelsApiResponse } from "@/lib/core/delivery-types";
import { parseParcels } from "@/lib/delivery/parse-parcels";
import { buildPicnicClient } from "@/lib/core/picnic-client";

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
    const rawParcels = await client.customerService.getParcels();
    const parcels = parseParcels(rawParcels);

    return NextResponse.json({ parcels });
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
