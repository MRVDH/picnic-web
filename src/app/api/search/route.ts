import { NextResponse, NextRequest } from "next/server";
import { getPicnicClient } from "@/lib/picnic-client";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const client = getPicnicClient();
    const page = await client.app.getPage(`search-page-results?search_term=${encodeURIComponent(query)}`);
    return NextResponse.json(page);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
