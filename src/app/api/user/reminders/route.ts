import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { GroceryReminderApiResponse } from "@/lib/core/user-types";
import { parseReminders } from "@/lib/user/parse-reminders";

/**
 * GET /api/user/reminders
 *
 * Returns the Boodschappenwekker: the selected days and their time, or no
 * days and the app's default time when it's off.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<GroceryReminderApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));
    const reminders = await client.customerService.getReminders();

    return NextResponse.json(parseReminders(reminders));
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/user/reminders] Failed:", message);

    return NextResponse.json(
      { error: "Failed to load your reminder. Please try again later." },
      { status: 502 }
    );
  }
}
