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

    if (!client_product_id || !plate || !start_time || !end_time) {
      return NextResponse.json(
        {
          success: false,
          error: "client_product_id, plate, start_time, en end_time zijn verplicht",
        },
        { status: 400 }
      );
    }

    // Resolve "now" to current time
    const resolvedStart =
      start_time === "now" ? new Date().toISOString() : start_time;

    // Step 1: Start the session
    const startResult = await egis.startParkingSession({
      client_product_id,
      vrn: plate.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      started_at: resolvedStart,
      ended_at: end_time,
      paid_parking_zone_id: zone_id || undefined,
    });

    // Step 2: Activate the session
    const activateResult = await egis.activateParkingSession(startResult);

    // Step 3: Log locally
    await logSession({
      plate: plate.toUpperCase(),
      start_time: resolvedStart,
      end_time,
      zone: zone_id ? String(zone_id) : null,
      cost: null,
      egis_id: null,
    });

    return NextResponse.json({
      success: true,
      data: { start: startResult, activate: activateResult },
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
