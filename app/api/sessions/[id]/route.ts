import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as egis from "@/lib/egis-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { new_ended_at } = body;

    if (!new_ended_at) {
      return NextResponse.json(
        { success: false, error: "new_ended_at is verplicht" },
        { status: 400 }
      );
    }

    const result = await egis.editParkingSession(parseInt(id), {
      new_ended_at,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Edit session error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
