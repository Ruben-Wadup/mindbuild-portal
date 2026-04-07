import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const ALLOWED_STATUSES = ["new", "day3_sent", "day7_sent", "converted", "lost"];

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leadId, status } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: "leadId en status zijn verplicht" }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }

    const result = await sql`
      UPDATE leads
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${leadId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead niet gevonden" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/lead-status]", err);
    return NextResponse.json({ error: "Update mislukt." }, { status: 500 });
  }
}
