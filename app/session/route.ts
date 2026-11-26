import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { COOKIE, MAX_AGE, createSession } from "@/backend/middleware/session";

function cookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    path: "/",
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTH_TOKEN || process.env.API_KEY;
  if (!secret) return NextResponse.json({ error: "Set AUTH_TOKEN on the host to enable sign-in." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? Buffer.from(body.password) : Buffer.alloc(0);
  const expected = Buffer.from(secret);
  if (body?.username !== (process.env.FORGE_USERNAME || "admin") ||
      password.length !== expected.length || !timingSafeEqual(password, expected)) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE, await createSession(secret), { ...cookieOptions(request), maxAge: MAX_AGE });
  return response;
}

export function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
