import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminPassword, createSessionToken } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 5, 60 * 1000); // 5 login attempts per min

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string" || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true, message: "Admin authenticated" });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
