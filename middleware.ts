import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySession } from "./backend/middleware/session";

export async function middleware(request: NextRequest) {
  const password = process.env.AUTH_TOKEN || process.env.API_KEY || "";
  if (await verifySession(password, request.cookies.get(COOKIE)?.value ?? "")) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/", "/bots/:path*", "/console", "/settings"] };
