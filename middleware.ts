import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
