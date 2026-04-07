import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json({ error: "Ongeldig wachtwoord." }, { status: 401 });
  }

  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguratie." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("portal_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("portal_session");
  return response;
}
