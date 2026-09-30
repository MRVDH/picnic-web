import { NextRequest, NextResponse } from "next/server";

import { parseCartFooter } from "@/lib/cart/parse-cart-footer";
import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse, CartFooterApiResponse } from "@/lib/core/types";

/** The app's basket footer page. */
const CART_FOOTER_PAGE_ID = "basket-footer-section-root";

/**
 * GET /api/cart/footer
 *
 * Returns the parts of the app's basket that are not in /cart: the
 * "Spaarpunten" line and the "Niets vergeten?" recommendation tiles.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CartFooterApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(CART_FOOTER_PAGE_ID);

    return NextResponse.json(parseCartFooter(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/cart/footer] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load the basket footer. Please try again later." },
      { status: 502 }
    );
  }
}
