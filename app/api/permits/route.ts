import { NextResponse } from "next/server";
import * as egis from "@/lib/egis-client";

/**
 * GET /api/permits
 * Returns the client_product_id and zone info by fetching from parking sessions.
 * The SSP token doesn't have access to /v1/permit/list, so we derive
 * permit info from the session history instead.
 */
export async function GET() {
  try {
    // Get recent sessions to find client_product_id
    const sessions = await egis.listParkingSessions({
      page: 1,
      row_per_page: 1,
    });

    if (sessions.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          client_product_id: null,
          permit_name: null,
          zones: [],
        },
      });
    }

    const firstSession = sessions.data[0];
    const clientProductId = firstSession.client_product_id;

    // Fetch available zones for this permit
    const zones = await egis.getParkingZones(clientProductId);

    return NextResponse.json({
      success: true,
      data: {
        client_product_id: clientProductId,
        permit_name: firstSession.permit_name,
        zone_description: firstSession.zone_description,
        machine_number: firstSession.machine_number,
        zones: zones.paid_parking_zones,
      },
    });
  } catch (error) {
    console.error("Get permits error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
