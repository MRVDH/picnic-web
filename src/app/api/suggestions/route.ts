import { NextRequest, NextResponse } from "next/server";
import { getPicnicClient } from "@/lib/picnic-client";
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
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ suggestions: [], query: "" });
  }

  try {
    const client = getPicnicClient();
    const rawSuggestions = await client.catalog.getSuggestions(query);

    const suggestions: SearchSuggestion[] = rawSuggestions.map((s) => ({
      id: s.id,
      suggestion: s.suggestion,
    }));

    return NextResponse.json({ suggestions, query });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/suggestions] Failed to fetch suggestions:", message);

    return NextResponse.json(
      { error: "Failed to fetch suggestions. Please try again later." },
      { status: 502 },
    );
  }
}
