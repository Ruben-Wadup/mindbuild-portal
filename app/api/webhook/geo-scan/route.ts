import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, url, score, enrichment, source, whatsappOptin, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is verplicht" }, { status: 400 });
    }

    const [lead] = await sql`
      INSERT INTO leads (email, url, score, source, status, enrichment, whatsapp_optin, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid)
      VALUES (
        ${email},
        ${url ?? null},
        ${score ?? null},
        ${source ?? 'geo_scan'},
        'new',
        ${enrichment ? JSON.stringify(enrichment) : null},
        ${!!whatsappOptin},
        ${utm_source ?? null},
        ${utm_medium ?? null},
        ${utm_campaign ?? null},
        ${utm_content ?? null},
        ${utm_term ?? null},
        ${gclid ?? null}
      )
      RETURNING id
    `;

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (err) {
    console.error("[webhook/geo-scan]", err);
    return NextResponse.json({ error: "Aanmaken lead mislukt." }, { status: 500 });
  }
}
