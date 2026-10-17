import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "rizq_admin_session";
export const EXPECTED_PASSWORD = process.env.ADMIN_PASSWORD || "demo_admin_2026";
export const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "rizq_luxury_villa_dubai_secret_token_32_chars_demo";

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Compare dummy buffer to avoid timing disclosure
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verifies admin password using timing-safe comparison.
 */
export function verifyAdminPassword(password: string): boolean {
  return secureCompare(password.trim(), EXPECTED_PASSWORD.trim());
}

/**
 * Creates a signed session token using HMAC-SHA256.
 */
export function createSessionToken(): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(`admin_authenticated:${EXPECTED_PASSWORD}`);
  return hmac.digest("hex");
}

/**
 * Validates a session token using timing-safe comparison.
 */
export function isValidSessionToken(token?: string | null): boolean {
  if (!token) return false;
  const expected = createSessionToken();
  return secureCompare(token, expected);
}

/**
 * Verifies the admin session from incoming cookies.
 */
export function verifyAdminSession(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}
