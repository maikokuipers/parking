import { NextResponse } from "next/server";
import * as egis from "@/lib/egis-client";

export async function GET() {
  try {
    const permits = await egis.getPermits();
    return NextResponse.json({ success: true, data: permits });
  } catch (error) {
    console.error("Get permits error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
