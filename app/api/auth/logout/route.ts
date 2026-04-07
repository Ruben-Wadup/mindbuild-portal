import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.mindbuild.nl")
  );
  response.cookies.delete("portal_session");
  return response;
}
