import { NextResponse } from "next/server";
import * as egis from "@/lib/egis-client";
import { logSession } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const page = searchParams.get("page") || "1";
    const rowPerPage = searchParams.get("row_per_page") || "20";

    const data = await egis.listParkingSessions({
      page: parseInt(page),
      row_per_page: parseInt(rowPerPage),
      product_id: productId ? parseInt(productId) : undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_product_id, plate, start_time, end_time, zone_id } = body;

    if (!client_product_id || !plate || !start_time || !end_time || !zone_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "client_product_id, plate, start_time, end_time, en zone_id zijn verplicht",
        },
        { status: 400 }
      );
    }

    // Clean plate: remove dashes and spaces, uppercase
    const cleanPlate = plate.toUpperCase().replace(/[-\s]/g, "");

    // Start the session
    const result = await egis.startParkingSession({
      client_product_id,
      vrn: cleanPlate,
      started_at: start_time,
      ended_at: end_time,
      zone_id,
    });

    // Log locally
    await logSession({
      plate: cleanPlate,
      start_time,
      end_time,
      zone: String(zone_id),
      cost: null,
      egis_id: String(result.parking_session_id),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
