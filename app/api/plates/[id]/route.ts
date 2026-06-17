import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as egis from "@/lib/egis-client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await egis.deleteFavoriteVrn(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete plate error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
