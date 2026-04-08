import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_IPS = ["62.45.64.134"];

function getClientIp(request: NextRequest): string | null {
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "true-client-ip",
  ];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) return value.split(",")[0].trim();
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip all Next.js internals and public paths
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/migrate") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // IP whitelist: only block if IP is known AND not allowed
  const clientIp = getClientIp(request);
  if (clientIp !== null && !ALLOWED_IPS.includes(clientIp)) {
    return new NextResponse("Toegang geweigerd.", { status: 403 });
  }

  // Session check
  const session = request.cookies.get("portal_session");
  const secret = process.env.PORTAL_SESSION_SECRET;

  if (!session?.value || !secret || session.value !== secret) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
