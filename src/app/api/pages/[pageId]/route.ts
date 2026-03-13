import { NextResponse, NextRequest } from "next/server";
import { getPicnicClient } from "@/lib/picnic-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const { pageId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Reconstruct full page path with query params
    let fullPath = pageId;
    const qs = searchParams.toString();
    if (qs) {
      fullPath += `?${qs}`;
    }

    const client = getPicnicClient();
    const data = await client.app.getPage(fullPath);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
