/**
 * Server-side JWT token manager for Egis API.
 * Caches the token in memory and auto-refreshes when expired.
 */

interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedToken: TokenCache | null = null;

function decodeJwtPayload(token: string): { exp: number; [key: string]: unknown } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT token");
  const payload = Buffer.from(parts[1], "base64").toString("utf-8");
  return JSON.parse(payload);
}

export async function getToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  // Try refresh first if we have an existing token
  if (cachedToken) {
    try {
      const refreshed = await refreshToken(cachedToken.token);
      if (refreshed) return refreshed;
    } catch {
      // Refresh failed, do fresh login
    }
  }

  // Fresh login
  return login();
}

async function login(): Promise<string> {
  const baseUrl = process.env.EGIS_API_BASE_URL;
  const username = process.env.EGIS_USERNAME;
  const password = process.env.EGIS_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error("Missing EGIS_API_BASE_URL, EGIS_USERNAME, or EGIS_PASSWORD env vars");
  }

  const response = await fetch(`${baseUrl}/ssp/login_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Egis login failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const token = data.token as string;
  const payload = decodeJwtPayload(token);

  cachedToken = {
    token,
    expiresAt: payload.exp * 1000,
  };

  console.log("[TokenManager] Login successful, token expires at", new Date(cachedToken.expiresAt).toISOString());
  return token;
}

async function refreshToken(currentToken: string): Promise<string | null> {
  const baseUrl = process.env.EGIS_API_BASE_URL;
  if (!baseUrl) return null;

  const response = await fetch(`${baseUrl}/refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const token = data.token as string;
  const payload = decodeJwtPayload(token);

  cachedToken = {
    token,
    expiresAt: payload.exp * 1000,
  };

  console.log("[TokenManager] Token refreshed, expires at", new Date(cachedToken.expiresAt).toISOString());
  return token;
}

export function clearToken(): void {
  cachedToken = null;
}
