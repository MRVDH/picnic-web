import { NextRequest, NextResponse } from "next/server";

import { readAuthToken, readCountryCode } from "@/lib/auth";

const ALLOWED_HOST_SUFFIX = ".picnicinternational.com";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  const token = readAuthToken(request);
  const countryCode = readCountryCode(request);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "okhttp/4.9.0",
        "Accept-Language": countryCode === "DE" ? "de" : "nl",
        "x-picnic-agent": "30100;1.228.1-15480;",
        "x-picnic-did": "3C417201548B2E3B",
        ...(token && { "x-picnic-auth": token }),
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
