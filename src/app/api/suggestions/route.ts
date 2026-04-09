import { NextRequest, NextResponse } from "next/server";
import { readAuthToken } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { isApiAuthError } from "@/lib/api-error";
import type {
  SuggestionsApiResponse,
  ApiErrorResponse,
  SearchSuggestion,
} from "@/lib/types";

/**
 * GET /api/suggestions?q=<query>
 *
 * Returns search suggestions from the Picnic API.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<SuggestionsApiResponse | ApiErrorResponse>> {
  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ suggestions: [], query: "" });
  }

  try {
    const client = buildPicnicClient(token);
    const rawSuggestions: Array<{ id: string; suggestion: string }> =
      await client.catalog.getSuggestions(query);

    const suggestions: SearchSuggestion[] = rawSuggestions.map((s) => ({
      id: s.id,
      suggestion: s.suggestion,
    }));

    return NextResponse.json({ suggestions, query });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/suggestions] Failed to fetch suggestions:", message);

    return NextResponse.json(
      { error: "Failed to fetch suggestions. Please try again later." },
      { status: 502 },
    );
  }
}


