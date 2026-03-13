import { NextResponse, NextRequest } from "next/server";
import { getPicnicClient } from "@/lib/picnic-client";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const client = getPicnicClient();
    const suggestions = await client.catalog.getSuggestions(query);
    return NextResponse.json(suggestions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
