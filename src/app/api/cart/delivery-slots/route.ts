import { NextRequest, NextResponse } from "next/server";

import { mapCart } from "@/lib/cart/map-cart";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import type { DeliverySlotPickerData } from "@/lib/core/delivery-slot-types";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CartData } from "@/lib/core/types";
import { buildSlotPicker } from "@/lib/delivery/group-delivery-slots";

// ─── GET /api/cart/delivery-slots ────────────────────────────────────────────

/**
 * Fetches all available delivery slots, with green choices marked by picnic-api,
 * grouped by day. Used by the slot picker modal.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<DeliverySlotPickerData | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);

    const overview = await client.cart.getDeliverySlotOverview();
    const pickerData = buildSlotPicker(overview, countryCode);

    return NextResponse.json(pickerData);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/delivery-slots] Failed to fetch slots:", message);

    return NextResponse.json(
      {
        error: "Failed to fetch delivery slots. Please try again later.",
      },
      { status: 502 }
    );
  }
}

// ─── POST /api/cart/delivery-slots ───────────────────────────────────────────

/**
 * Selects a delivery slot. Returns the full updated cart state (same shape as
 * GET /api/cart) so the cart page can reconcile all state in one shot.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CartData | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  let body: { slotId?: string };
  try {
    body = (await request.json()) as { slotId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.slotId || typeof body.slotId !== "string") {
    return NextResponse.json({ error: "Missing required field: slotId" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, countryCode);

    // Picnic requires x-picnic-agent / x-picnic-did for cart mutations (same as add/remove).
    const rawCart = await client.cart.setDeliverySlot(body.slotId);

    const cartData = mapCart(client.cart.parseCart(rawCart), countryCode);

    return NextResponse.json(cartData);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/delivery-slots] Failed to set slot:", message);

    return NextResponse.json(
      {
        error: "Failed to set delivery slot. Please try again.",
      },
      { status: 502 }
    );
  }
}
