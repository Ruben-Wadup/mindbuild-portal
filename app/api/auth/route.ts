import { NextRequest, NextResponse } from "next/server";
import { verifyTotp } from "@/lib/totp";

const TRUSTED_DEVICE_COOKIE = "portal_trusted";
const TRUSTED_DEVICE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen

function isTrustedDevice(req: NextRequest): boolean {
  const trusted = req.cookies.get(TRUSTED_DEVICE_COOKIE);
  const secret = process.env.PORTAL_SESSION_SECRET;
  return !!trusted && !!secret && trusted.value === `trusted_${secret.slice(0, 16)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, totpToken, trustDevice } = body;

  const secret = process.env.PORTAL_SESSION_SECRET;
  const totpSecret = process.env.TOTP_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguratie." }, { status: 500 });
  }

  // Stap 1: wachtwoord controleren
  if (!password || password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json({ error: "Ongeldig wachtwoord." }, { status: 401 });
  }

  // Stap 2: TOTP controleren (als geconfigureerd)
  if (totpSecret) {
    // Trusted device? Dan geen TOTP nodig
    if (!isTrustedDevice(req)) {
      if (!totpToken) {
        // Wachtwoord ok, maar nog geen TOTP — vraag om code
        return NextResponse.json({ requireTotp: true }, { status: 200 });
      }
      if (!verifyTotp(totpToken, totpSecret)) {
        return NextResponse.json({ error: "Ongeldige authenticatiecode." }, { status: 401 });
      }
    }
  }

  // Sessie cookie zetten
  const response = NextResponse.json({ ok: true });
  response.cookies.set("portal_session", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  // Trusted device cookie zetten als gevraagd
  if (trustDevice && totpSecret) {
    response.cookies.set(TRUSTED_DEVICE_COOKIE, `trusted_${secret.slice(0, 16)}`, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: TRUSTED_DEVICE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("portal_session");
  response.cookies.delete(TRUSTED_DEVICE_COOKIE);
  return response;
}
