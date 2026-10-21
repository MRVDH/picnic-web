import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { DeliveryTrackingData } from "@/lib/core/delivery-types";
import { cachedCall } from "@/lib/core/page-cache";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import { mapDeliveryTracking } from "@/lib/delivery/map-delivery";

/** The route only changes with its version, so keep it for the length of a delivery. */
const ROUTE_TTL_MS = 60 * 60 * 1000;

/**
 * GET /api/deliveries/[deliveryId]/tracking?routeVersion=<version>
 *
 * Where the delivery is: the position (fetched on every call, poll again after
 * `queryInterval`) combined with the route, which is fetched again only when the
 * position reports another route version. When `routeVersion` is the current
 * version, the response leaves out the route and the vehicle image, which the
 * caller already has.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
): Promise<NextResponse<DeliveryTrackingData | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const { deliveryId } = await params;

  if (!deliveryId) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  try {
    const countryCode = readCountryCode(request);
    const client = buildPicnicClient(token, countryCode);
    const position = await client.delivery.getDeliveryPosition(deliveryId);
    const scenario = await cachedCall(
      client,
      `delivery-route:${deliveryId}:${position.version}`,
      () => client.delivery.getDeliveryScenario(deliveryId),
      ROUTE_TTL_MS
    );
    const tracking = mapDeliveryTracking(
      client.delivery.parseTracking(position, scenario),
      countryCode
    );
    const knownVersion = request.nextUrl.searchParams.get("routeVersion");
    return NextResponse.json(
      knownVersion === String(tracking.scenarioVersion)
        ? { ...tracking, route: [], vehicleImageDataUrl: null }
        : tracking
    );
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/deliveries/${deliveryId}/tracking] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load delivery tracking. Please try again later." },
      { status: 502 }
    );
  }
}
