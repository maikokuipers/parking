import { NextResponse } from "next/server";
import { getFavoritePlates, createFavoritePlate } from "@/lib/db";

export async function GET() {
  try {
    const plates = await getFavoritePlates();
    return NextResponse.json({ success: true, data: plates });
  } catch (error) {
    console.error("Get plates error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plate, description, sort_order } = body;

    if (!plate) {
      return NextResponse.json(
        { success: false, error: "Kenteken is verplicht" },
        { status: 400 }
      );
    }

    const created = await createFavoritePlate({
      plate: plate.toUpperCase().replace(/\s+/g, "-"),
      description: description || null,
      sort_order: sort_order ?? 0,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Create plate error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
