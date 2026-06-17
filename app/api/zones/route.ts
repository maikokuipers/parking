import { NextResponse } from "next/server";
import * as egis from "@/lib/egis-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "product_id is verplicht" },
        { status: 400 }
      );
    }

    const zones = await egis.getParkingZones(parseInt(productId));
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    console.error("Get zones error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
