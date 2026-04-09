import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { isApiAuthError } from "@/lib/api-error";
import { parseCartResponse } from "@/lib/parse-cart";
import type { CartData, ApiErrorResponse } from "@/lib/types";

/**
 * GET /api/cart
 *
 * Fetches the user's shopping cart from the Picnic API using the sendRequest
 * cast pattern (same as /api/search and /api/product). The raw response is
 * `unknown` and is validated/transformed at runtime by parseCartResponse.
 * Returns a CartData JSON object.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<CartData | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  try {
    const client = buildPicnicClient(token);

    // Use the sendRequest cast pattern — /cart returns structured JSON, not a
    // Fusion page, so includePicnicHeaders (4th arg) is false.
    const rawCart = await (
      client as unknown as {
        sendRequest: (
          method: string,
          path: string,
          body: null,
          includeFusion: boolean,
        ) => Promise<unknown>;
      }
    ).sendRequest("GET", "/cart", null, false);

    const cartData = parseCartResponse(rawCart);

    return NextResponse.json(cartData);
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart] Failed to fetch cart:", message);

    return NextResponse.json(
      {
        error:
          "Kan winkelwagen niet ophalen. Probeer het later opnieuw.",
      },
      { status: 502 },
    );
  }
}
