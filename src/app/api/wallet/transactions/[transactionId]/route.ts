import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { TransactionDetailApiResponse } from "@/lib/core/wallet-types";
import { parseTransactionDetail } from "@/lib/wallet/parse-transaction-detail";

/**
 * GET /api/wallet/transactions/[transactionId]
 *
 * Returns one payment from the Betaaloverzicht: the order lines it covers,
 * substitutions, deposits, the amount and the payment method.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
): Promise<NextResponse<TransactionDetailApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const { transactionId } = await params;

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const raw = await client.payment.getWalletTransactionDetails(transactionId);

    return NextResponse.json(parseTransactionDetail(transactionId, raw));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/wallet/transactions/${transactionId}] Failed:`, message);

    return NextResponse.json(
      { error: "Failed to load the payment. Please try again later." },
      { status: 502 }
    );
  }
}
