import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { notifyPush } from "@/lib/ntfy";

type LeadRow = {
  id: string;
  email: string | null;
  naam: string | null;
  bedrijf: string | null;
  url: string | null;
  score: number | null;
  enrichment: { phone?: string } | null;
};

// Convert raw phone string → E.164 digits (no + prefix) suitable for wa.me
function toWaNumber(raw: string | undefined | null, urlHint: string | null): string | null {
  if (!raw) return null;
  let n = String(raw).replace(/[^0-9+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);

  // Local format → international based on URL TLD
  if ((n.startsWith("06") || n.startsWith("04") || (n.startsWith("0") && n.length >= 9))) {
    const isBE = !!urlHint && /\.be(\/|$|\?)/i.test(urlHint);
    const cc = isBE ? "32" : "31";
    n = cc + n.slice(1);
  }

  // Mobile prefixes only
  const mobileOk = /^(31[67]|324|491|336|447)/.test(n);
  if (!mobileOk) return null;
  if (n.length < 10 || n.length > 15) return null;
  return n;
}

async function findWhatsappNumber(url: string, enrichmentPhone: string | undefined): Promise<string | null> {
  const target = url.startsWith("http") ? url : `https://${url}`;

  // 1. Try scraping for explicit wa.me / api.whatsapp.com link
  try {
    const res = await fetch(target, {
      method: "GET",
      headers: { "User-Agent": "MindBuildPortal/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();

    const waMatch = html.match(/wa\.me\/(\+?[0-9]{10,15})/i)
                 || html.match(/api\.whatsapp\.com\/send\?phone=(\+?[0-9]{10,15})/i);
    if (waMatch) {
      const num = toWaNumber(waMatch[1], target);
      if (num) return num;
    }

    // 2. Try tel: links in HTML
    const telMatches = html.match(/href=["']tel:([^"']+)["']/gi) || [];
    for (const m of telMatches) {
      const raw = m.match(/tel:([^"']+)/i)?.[1];
      const num = toWaNumber(raw ?? null, target);
      if (num) return num;
    }
  } catch {
    // Scrape failed, fall through
  }

  // 3. Fall back to enrichment phone
  return toWaNumber(enrichmentPhone ?? null, url);
}

function buildMessage(lead: LeadRow): string {
  const firstName = lead.naam?.split(" ")[0]
    || (lead.email ? lead.email.split("@")[0].split(/[._]/)[0] : "");
  const greeting = firstName ? `Hey ${firstName.charAt(0).toUpperCase() + firstName.slice(1)}` : "Hey";
  const domain = lead.url?.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0] || "je website";

  return `${greeting}, Ruben van MindBuild hier. Je vroeg eerder een GEO scan aan voor ${domain} — heb je het rapport ontvangen? Als je vragen hebt of even wilt sparren over hoe AI-zoekmachines (ChatGPT, Google AI) jouw aanbod kunnen oppikken, hoor ik het graag. Geen verkoop, gewoon even kijken of het nuttig is.`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [lead] = await sql<LeadRow[]>`
    SELECT id, email, naam, bedrijf, url, score, enrichment
    FROM leads
    WHERE id = ${id}
  `;

  if (!lead) {
    return NextResponse.json({ error: "Lead niet gevonden" }, { status: 404 });
  }

  if (!lead.url) {
    return NextResponse.json({ error: "Deze lead heeft geen website URL" }, { status: 400 });
  }

  const enrichmentPhone =
    typeof lead.enrichment === "object" && lead.enrichment !== null && "phone" in lead.enrichment
      ? (lead.enrichment as { phone?: string }).phone
      : undefined;

  const waNumber = await findWhatsappNumber(lead.url, enrichmentPhone);
  if (!waNumber) {
    return NextResponse.json({
      ok: false,
      error: "Geen WhatsApp-nummer gevonden op de site of in enrichment.",
    });
  }

  const message = buildMessage(lead);
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  const domain = lead.url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
  const displayName = lead.naam || lead.email?.split("@")[0] || domain;

  notifyPush({
    title: `WhatsApp: ${displayName}`,
    body: `Tik om te openen — bericht staat klaar.\nNummer: +${waNumber}\n${lead.score != null ? `GEO score: ${lead.score}/100` : ""}`,
    tags: ["speech_balloon"],
    priority: "high",
    click: waLink,
    actions: `view, Open WhatsApp, ${waLink}, clear=true`,
  });

  return NextResponse.json({
    ok: true,
    waNumber,
    waLink,
    message,
  });
}
