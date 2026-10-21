import { NextRequest, NextResponse } from "next/server";

import { mapCart } from "@/lib/cart/map-cart";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CartData, CartMutationRequest } from "@/lib/core/types";

/**
 * GET /api/cart
 *
 * Fetches the user's shopping cart with picnic-api's cart.getCartContents and
 * returns it as CartData.
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

    const cartData = mapCart(await client.cart.getCartContents(), countryCode);

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
        error: "Failed to fetch cart. Please try again later.",
      },
      { status: 502 }
    );
  }
}

// ─── DELETE /api/cart ───────────────────────────────────────────────────────

/**
 * DELETE /api/cart
 *
 * Clears all items from the user's cart by calling POST /cart/clear on the
 * Picnic API. Returns the resulting empty CartData.
 */
export async function DELETE(
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
    const cartData = mapCart(client.cart.parseCart(await client.cart.clearCart()), countryCode);
    return NextResponse.json(cartData);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart] Failed to clear cart:", message);

    return NextResponse.json({ error: "Failed to clear cart. Please try again." }, { status: 502 });
  }
}

// ─── POST /api/cart ─────────────────────────────────────────────────────────

/**
 * POST /api/cart
 *
 * Adds or removes a product from the user's cart, depending on the `action`
 * field ("add" or "remove"). Both return the full cart, returned as CartData.
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

  try {
    const client = buildPicnicClient(token, countryCode);

    const rawCart =
      body.action === "add"
        ? await client.cart.addProductToCart(body.productId, body.count)
        : await client.cart.removeProductFromCart(body.productId, body.count);
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
    console.error("[/api/cart] Failed to mutate cart:", message);

    return NextResponse.json(
      {
        error: "Failed to update cart. Please try again.",
      },
      { status: 502 }
    );
  }
}
