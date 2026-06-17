import { NextResponse } from "next/server";
import { savePlateOrder } from "@/lib/db";

/**
 * PUT /api/plates/order
 * Saves the display order of favorite plates.
 * Body: { order: ["VRN1", "VRN2", "VRN3", ...] }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { success: false, error: "order moet een array van kentekens zijn" },
        { status: 400 }
      );
    }

    const plateOrder = order.map((vrn: string, index: number) => ({
      vrn,
      sort_order: index,
    }));

    await savePlateOrder(plateOrder);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save plate order error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
