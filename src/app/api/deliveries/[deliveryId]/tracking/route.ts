import { NextRequest, NextResponse } from "next/server";

import type PicnicClient from "picnic-api";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { DeliveryTrackingData } from "@/lib/core/delivery-types";
import { scopedCacheKey } from "@/lib/core/page-cache";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import { mapDeliveryTracking } from "@/lib/delivery/map-delivery";

type DeliveryRoute = PicnicClient.Types.delivery.DeliveryRoute;

/** Polls keep at most this many routes, the last one per delivery and user. */
const MAX_KNOWN_ROUTES = 200;

/** The last route per delivery and user, so a poll skips the route while its version holds. */
const knownRoutes = new Map<string, DeliveryRoute>();

/**
 * GET /api/deliveries/[deliveryId]/tracking?routeVersion=<version>
 *
 * Where the delivery is: picnic-api's getDeliveryTracking with the last route of this delivery,
 * which fetches the position on every call (poll again after `queryInterval`) and the route
 * only when the position reports another route version. When `routeVersion` is the current
 * version, the response leaves out the route and the vehicle image, which the caller already
 * has.
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
    const routeKey = scopedCacheKey(client, `delivery-route:${deliveryId}`);
    const result = await client.delivery.getDeliveryTracking(deliveryId, knownRoutes.get(routeKey));
    if (knownRoutes.size >= MAX_KNOWN_ROUTES) knownRoutes.clear();
    knownRoutes.set(routeKey, result.route);
    const tracking = mapDeliveryTracking(result, countryCode);
    const knownVersion = request.nextUrl.searchParams.get("routeVersion");
    return NextResponse.json(
      knownVersion === String(tracking.routeVersion)
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
