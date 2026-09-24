import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { WalletApiResponse } from "@/lib/core/wallet-types";
import { parseWalletPage } from "@/lib/wallet/parse-wallet-pages";

/** The app's Portemonnee page. */
const WALLET_PAGE_ID = "portemonnee-page";

/**
 * GET /api/wallet
 *
 * Returns the Portemonnee page (portemonnee-page): the Picnic-tegoed card,
 * the payment methods row and the payment history, with Picnic's texts.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<WalletApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(WALLET_PAGE_ID);

    return NextResponse.json(parseWalletPage(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/wallet] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load the wallet. Please try again later." },
      { status: 502 }
    );
  }
}
