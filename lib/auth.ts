/**
 * PIN-based authentication for the app.
 * Uses a signed cookie to track authentication state.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "parkeerhulp_auth";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.COOKIE_SECRET || "default-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const correctPin = process.env.APP_PIN || "1234";
  return pin === correctPin;
}

export async function createAuthCookie(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());

  return token;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie) return false;

    await jwtVerify(cookie.value, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
