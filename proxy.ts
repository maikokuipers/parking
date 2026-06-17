/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Protects all routes except /pin and /api/auth with PIN authentication.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "parkeerhulp_auth";

function getSecret(): Uint8Array {
  const secret = process.env.COOKIE_SECRET || "default-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to PIN page and auth API without authentication
  if (
    pathname === "/pin" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  // Check for valid auth cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie) {
    return NextResponse.redirect(new URL("/pin", request.url));
  }

  try {
    await jwtVerify(cookie.value, getSecret());
    return NextResponse.next();
  } catch {
    // Invalid or expired cookie
    const response = NextResponse.redirect(new URL("/pin", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
