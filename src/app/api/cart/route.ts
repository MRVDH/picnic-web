import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/api-error";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { parseCartResponse } from "@/lib/parse-cart";
import { buildPicnicClient } from "@/lib/picnic-client";
import type { ApiErrorResponse, CartData, CartMutationRequest } from "@/lib/types";

/**
 * GET /api/cart
 *
 * Fetches the user's shopping cart from the Picnic API using the sendRequest
 * cast pattern (same as /api/search and /api/product). The raw response is
 * `unknown` and is validated/transformed at runtime by parseCartResponse.
 * Returns a CartData JSON object.
 */
export async function GET(
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

  try {
    const client = buildPicnicClient(token, countryCode);

    // Use the sendRequest cast pattern — include Picnic headers (4th arg)
    // so decorator_overrides (bundle discounts, etc.) are returned.
    const rawCart = await (
      client as unknown as {
        sendRequest: (
          method: string,
          path: string,
          body: null,
          includeFusion: boolean
        ) => Promise<unknown>;
      }
    ).sendRequest("GET", "/cart", null, true);

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
    console.error("[/api/cart] Failed to fetch cart:", message);

    return NextResponse.json(
      {
        error: "Kan winkelwagen niet ophalen. Probeer het later opnieuw.",
      },
      { status: 502 }
    );
  }
}

// ─── POST /api/cart ─────────────────────────────────────────────────────────

/**
 * POST /api/cart
 *
 * Adds or removes a product from the user's cart. Reads the `action` field
 * to determine which Picnic API endpoint to call:
 *   - "add"    → POST /cart/add_product
 *   - "remove" → POST /cart/remove_product
 *
 * Both Picnic endpoints return the full cart response, which is parsed by
 * parseCartResponse and returned as CartData.
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

  let body: CartMutationRequest;
  try {
    body = (await request.json()) as CartMutationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.productId || !body.action || typeof body.count !== "number") {
    return NextResponse.json(
      { error: "Missing required fields: productId, action, count" },
      { status: 400 }
    );
  }

  if (body.action !== "add" && body.action !== "remove") {
    return NextResponse.json({ error: 'action must be "add" or "remove"' }, { status: 400 });
  }

  const endpoint = body.action === "add" ? "/cart/add_product" : "/cart/remove_product";

  try {
    const client = buildPicnicClient(token, countryCode);

    const rawCart = await (
      client as unknown as {
        sendRequest: (
          method: string,
          path: string,
          body: Record<string, unknown>,
          includeFusion: boolean
        ) => Promise<unknown>;
      }
    ).sendRequest(
      "POST",
      endpoint,
      {
        product_id: body.productId,
        count: body.count,
      },
      true
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
    console.error("[/api/cart] Failed to mutate cart:", message);

    return NextResponse.json(
      {
        error: "Kan winkelwagen niet bijwerken. Probeer het opnieuw.",
      },
      { status: 502 }
    );
  }
}
