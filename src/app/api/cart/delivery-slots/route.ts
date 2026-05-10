import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import type { DeliverySlotPickerData } from "@/lib/delivery-slot-types";
import { parseCartResponse } from "@/lib/parse-cart";
import { parseDeliverySlotsPicker } from "@/lib/parse-delivery-slots";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, CartData } from "@/lib/types";

// ─── sendRequest cast type ───────────────────────────────────────────────────

type SendRequestClient = {
  sendRequest: (
    method: string,
    path: string,
    body: Record<string, unknown> | null,
    includeFusion: boolean
  ) => Promise<unknown>;
};

// ─── GET /api/cart/delivery-slots ────────────────────────────────────────────

/**
 * Fetches all available delivery slots from the Picnic API, parsed and grouped
 * by day with green-choice identification. Used by the slot picker modal.
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

    const rawResult = await (client as unknown as SendRequestClient).sendRequest(
      "GET",
      "/cart/delivery_slots",
      null,
      false
    );

    const pickerData = parseDeliverySlotsPicker(rawResult);

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

    const rawCart = await (client as unknown as SendRequestClient).sendRequest(
      "POST",
      "/cart/set_delivery_slot",
      {
        slot_id: body.slotId,
      },
      false
    );

    const cartData = parseCartResponse(rawCart);

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
