import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateShortcut, deleteShortcut } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateShortcut(parseInt(id), body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Shortcut niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update shortcut error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteShortcut(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Shortcut niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shortcut error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
