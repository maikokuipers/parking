import { NextResponse } from "next/server";
import * as egis from "@/lib/egis-client";
import { getPlateOrder } from "@/lib/db";

/**
 * GET /api/plates
 * Returns favorite license plates from Egis, sorted by local plate_order.
 * Plates without a local order entry are appended at the end.
 */
export async function GET() {
  try {
    const [egisData, orderMap] = await Promise.all([
      egis.getFavoriteVrns(),
      getPlateOrder(),
    ]);

    const plates = egisData.favorite_vrns.map((fav) => ({
      id: fav.id,
      plate: fav.vrn,
      description: fav.description,
      sort_order: orderMap.get(fav.vrn) ?? 999,
    }));

    plates.sort((a, b) => a.sort_order - b.sort_order);

    return NextResponse.json({ success: true, data: plates });
  } catch (error) {
    console.error("Get plates error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plates
 * Adds a favorite license plate via the Egis API.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plate, description } = body;

    if (!plate) {
      return NextResponse.json(
        { success: false, error: "Kenteken is verplicht" },
        { status: 400 }
      );
    }

    const cleanPlate = plate.toUpperCase().replace(/[-\s]/g, "");
    await egis.addFavoriteVrn({
      vrn: cleanPlate,
      description: description || cleanPlate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add plate error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
