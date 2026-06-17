import { NextResponse } from "next/server";
import { getShortcuts, createShortcut } from "@/lib/db";

export async function GET() {
  try {
    const shortcuts = await getShortcuts();
    return NextResponse.json({ success: true, data: shortcuts });
  } catch (error) {
    console.error("Get shortcuts error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, start_time, end_time, sort_order } = body;

    if (!label || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "label, start_time, en end_time zijn verplicht" },
        { status: 400 }
      );
    }

    const shortcut = await createShortcut({
      label,
      start_time,
      end_time,
      sort_order: sort_order ?? 0,
    });

    return NextResponse.json({ success: true, data: shortcut });
  } catch (error) {
    console.error("Create shortcut error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
