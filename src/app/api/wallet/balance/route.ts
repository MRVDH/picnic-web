import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { BalanceApiResponse } from "@/lib/core/wallet-types";
import { parseBalancePage } from "@/lib/wallet/parse-wallet-pages";

/** The app's Picnic-tegoed page. */
const BALANCE_PAGE_ID = "saldo-overview-page";

/**
 * GET /api/wallet/balance
 *
 * Returns the Picnic-tegoed page (saldo-overview-page): the balance card and
 * the balance history per day, with Picnic's texts.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<BalanceApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const rawPage = await client.app.getPage(BALANCE_PAGE_ID);

    return NextResponse.json(parseBalancePage(rawPage));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/wallet/balance] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load the balance. Please try again later." },
      { status: 502 }
    );
  }
}
