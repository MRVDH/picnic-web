import { NextResponse } from "next/server";
import { getPicnicClient } from "@/lib/picnic-client";

export async function GET() {
  try {
    const client = getPicnicClient();
    const data = await client.app.getBootstrapData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
