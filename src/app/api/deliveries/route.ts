import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { DeliveriesApiResponse } from "@/lib/core/delivery-types";
import { parseDeliveriesSummary } from "@/lib/delivery/parse-deliveries-summary";
import { buildPicnicClient } from "@/lib/core/picnic-client";

const VALID_STATUSES = new Set(["CURRENT", "COMPLETED", "CANCELLED"]);

export async function GET(
  request: NextRequest
): Promise<NextResponse<DeliveriesApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);
  const statusParam = request.nextUrl.searchParams.get("status");
  const filter =
    statusParam && VALID_STATUSES.has(statusParam)
      ? ([statusParam] as ("CURRENT" | "COMPLETED" | "CANCELLED")[])
      : [];

  try {
    const client = buildPicnicClient(token, countryCode);
    const rawDeliveries = await client.delivery.getDeliveries(filter);
    const deliveries = parseDeliveriesSummary(rawDeliveries, countryCode);

    return NextResponse.json({ deliveries });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/deliveries] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load deliveries. Please try again later." },
      { status: 502 }
    );
  }
}
