import { NextResponse } from "next/server";
import { verifyPin, createAuthCookie, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json(
        { success: false, error: "PIN is verplicht" },
        { status: 400 }
      );
    }

    const valid = await verifyPin(pin);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Onjuiste PIN" },
        { status: 401 }
      );
    }

    const token = await createAuthCookie();
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, error: "Interne fout" },
      { status: 500 }
    );
  }
}
