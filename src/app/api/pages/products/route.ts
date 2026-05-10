import { NextRequest, NextResponse } from "next/server";
import { readAuthToken, readCountryCode } from "@/lib/auth";
import { buildPicnicClient } from "@/lib/picnic-client";
import { parseCategoryPageSections } from "@/lib/parse-fusion-search";
import { extractPageTitle } from "@/lib/parse-subcategories";
import { isApiAuthError } from "@/lib/api-error";
import type { CategoryProductsApiResponse, ApiErrorResponse } from "@/lib/types";

/**
 * GET /api/pages/products?pageId=...
 *
 * Fetches an arbitrary Picnic page by its full page ID (as extracted
 * from a deep-link target) and returns any products found in the PML
 * tree. Works for promotional pages, campaign pages, and category
 * pages alike.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CategoryProductsApiResponse | ApiErrorResponse>> {
  const pageId = request.nextUrl.searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId parameter" }, { status: 400 });
  }

  const token = readAuthToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "TOKEN_EXPIRED" as const },
      { status: 401 }
    );
  }

  const countryCode = readCountryCode(request);

  try {
    const client = buildPicnicClient(token, countryCode);
    const rawPage = await client.app.getPage(pageId);
    const title = extractPageTitle(rawPage);
    const { sections, products } = parseCategoryPageSections(rawPage);

    return NextResponse.json({ title, products, sections });
  } catch (error) {
    if (isApiAuthError(error)) {
      return NextResponse.json(
        { error: "Your token has expired", code: "TOKEN_EXPIRED" as const },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[/api/pages/products] Failed for pageId="${pageId}":`, message);

    return NextResponse.json(
      { error: "Kan producten niet laden. Probeer het later opnieuw." },
      { status: 502 }
    );
  }
}
