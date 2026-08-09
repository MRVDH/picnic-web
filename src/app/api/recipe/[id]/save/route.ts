import { NextRequest, NextResponse } from "next/server";

import { isApiAuthError } from "@/lib/core/api-error";
import { readAuthToken, readCountryCode } from "@/lib/core/auth";
import { buildPicnicClient } from "@/lib/core/picnic-client";
import type { ApiErrorResponse } from "@/lib/core/types";

const RECIPE_ID_RE = /^[0-9a-f]{24}$/;

type RequestBody = { saved: boolean };

/** Save or unsave a recipe on the user's Picnic account. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ saved: boolean } | ApiErrorResponse>> {
  const token = readAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!RECIPE_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.saved !== "boolean") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const client = buildPicnicClient(token, readCountryCode(request));

    if (body.saved) {
      await client.recipe.saveRecipe(id);
    } else {
      await client.recipe.unsaveRecipe(id);
    }

    return NextResponse.json({ saved: body.saved });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[/api/recipe/[id]/save] Failed:", message);

    return NextResponse.json({ error: "Failed to update saved recipe" }, { status: 502 });
  }
}
