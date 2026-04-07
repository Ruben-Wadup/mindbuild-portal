import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_IPS = ["62.45.64.134"];

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — no auth required
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/migrate") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // IP whitelist check
  const clientIp = getClientIp(request);
  if (!ALLOWED_IPS.includes(clientIp)) {
    return new NextResponse("Toegang geweigerd.", { status: 403 });
  }

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
