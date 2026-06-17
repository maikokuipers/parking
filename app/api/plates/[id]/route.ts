import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteFavoritePlate } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteFavoritePlate(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Kenteken niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete plate error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
