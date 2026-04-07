import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, url, score } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is verplicht" }, { status: 400 });
    }

    const [lead] = await sql`
      INSERT INTO leads (email, url, score, source, status)
      VALUES (${email}, ${url ?? null}, ${score ?? null}, 'geo_scan', 'new')
      RETURNING id
    `;

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (err) {
    console.error("[webhook/geo-scan]", err);
    return NextResponse.json({ error: "Aanmaken lead mislukt." }, { status: 500 });
  }
}
