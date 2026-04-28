import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

type LeadRow = {
  id: string;
  url: string | null;
  enrichment: Record<string, unknown> | null;
};

type ScrapedData = {
  // Identity
  business_name?: string;
  tagline?: string;
  description?: string;
  language?: string;
  // Contact
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  // Socials
  linkedin_company?: string;
  linkedin_personal?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  // Meta
  scraped_at?: string;
  scraped_pages?: string[];
  industry_hints?: string[];
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function findFirst<T>(...vals: (T | undefined)[]): T | undefined {
  return vals.find((v) => v !== undefined && v !== null && (typeof v !== "string" || v.length > 0));
}

function extractFromHtml(html: string, baseUrl: string): ScrapedData {
  const data: ScrapedData = {};

  // Language
  const langMatch = html.match(/<html[^>]+lang=["']([a-zA-Z-]+)/i);
  if (langMatch) data.language = langMatch[1].toLowerCase();

  // Title / business name
  const ogSiteName = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)/i)?.[1];
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  data.business_name = findFirst(ogSiteName, title)?.trim().slice(0, 120);

  // Tagline (meta description)
  const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i)?.[1]
            ?? html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)/i)?.[1];
  if (desc) data.tagline = decodeEntities(desc).trim().slice(0, 300);

  // Description: first significant <p>
  const pMatches = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
  for (const m of pMatches) {
    const text = stripHtml(m[1]);
    if (text.length > 60 && text.length < 600) {
      data.description = text.slice(0, 500);
      break;
    }
  }

  // Phone (NL/BE patterns + tel: links)
  const tel = html.match(/href=["']tel:([^"']+)["']/i)?.[1];
  if (tel) data.phone = tel.trim();
  if (!data.phone) {
    const phoneMatch = html.match(/(\+?(?:31|32)\s?\(?[0-9]{1,3}\)?[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4})/);
    if (phoneMatch) data.phone = phoneMatch[1].trim();
  }

  // WhatsApp link
  const wa = html.match(/wa\.me\/(\+?[0-9]{10,15})/i)?.[1]
          ?? html.match(/api\.whatsapp\.com\/send\?phone=(\+?[0-9]{10,15})/i)?.[1];
  if (wa) data.whatsapp = wa.replace(/^\+/, "");

  // Email (skip example/placeholder)
  const emailMatches = [...html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)];
  for (const m of emailMatches) {
    const e = m[0].toLowerCase();
    if (e.includes("example.") || e.includes("yourdomain") || e.includes("@email") || e.endsWith("@2x.png") || e.endsWith("@3x.png")) continue;
    data.email = e;
    break;
  }

  // Address (Dutch/Belgian postal code pattern)
  const addr = html.match(/[A-Za-zÀ-ÿ\.\s]+\s+[0-9]+[a-zA-Z]?\s*[,\s]\s*[0-9]{4}\s?[A-Z]{2}\s+[A-Za-zÀ-ÿ\s]+/);
  if (addr) data.address = addr[0].replace(/\s+/g, " ").trim().slice(0, 200);

  // Socials
  const li = html.match(/https?:\/\/(?:www\.|nl\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>?]+/gi) ?? [];
  for (const url of li) {
    if (url.includes("/company/") && !data.linkedin_company) data.linkedin_company = url;
    if (url.includes("/in/") && !data.linkedin_personal) data.linkedin_personal = url;
  }

  const ig = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i)?.[0];
  if (ig && !ig.endsWith("/p/") && !ig.includes("/p/")) data.instagram = ig.split("?")[0];

  const fb = html.match(/https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)/i)?.[0];
  if (fb && !["sharer", "share", "tr", "v2.0"].some((x) => fb.includes(x))) data.facebook = fb.split("?")[0];

  const tw = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
  if (tw && !["intent", "share", "home"].includes(tw[1])) data.twitter = `https://x.com/${tw[1]}`;

  const yt = html.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:@[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+|channel\/[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+)/i)?.[0];
  if (yt) data.youtube = yt.split("?")[0];

  const tt = html.match(/https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+/i)?.[0];
  if (tt) data.tiktok = tt.split("?")[0];

  // Industry hints (from common keywords in title + description)
  const text = `${data.business_name ?? ""} ${data.tagline ?? ""} ${data.description ?? ""}`.toLowerCase();
  const keywords = ["coach", "advies", "consultancy", "marketing", "design", "webshop", "horeca", "bouw", "zorg", "fysio", "tandarts", "hr", "recruiter", "trainer", "lifestyle", "fitness", "voeding", "diëtist", "psycholoog", "therapeut", "fotograaf", "video", "muziek", "evenement", "school", "opleiding", "training", "software", "developer", "agency", "studio", "winkel", "restaurant", "salon", "wellness", "coaching", "vastgoed", "makelaar", "advocaat", "boekhouder", "accountant"];
  data.industry_hints = keywords.filter((k) => text.includes(k));

  // baseUrl is currently unused but kept for possible future absolute-URL resolution
  void baseUrl;

  return data;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MindBuildPortal/1.0 (+https://mindbuild.nl)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [lead] = await sql<LeadRow[]>`
    SELECT id, url, enrichment FROM leads WHERE id = ${id}
  `;

  if (!lead) return NextResponse.json({ error: "Lead niet gevonden" }, { status: 404 });
  if (!lead.url) return NextResponse.json({ error: "Lead heeft geen URL" }, { status: 400 });

  const homepage = lead.url.startsWith("http") ? lead.url : `https://${lead.url}`;
  const homepageHtml = await fetchHtml(homepage);

  if (!homepageHtml) {
    return NextResponse.json({ ok: false, error: "Kon website niet ophalen" });
  }

  // Extract data from homepage
  const homeData = extractFromHtml(homepageHtml, homepage);
  const pagesScraped = [homepage];

  // Try to find a contact page link and scrape it for more contact info
  const contactLinkMatch = homepageHtml.match(/href=["']([^"']*(?:contact|over-ons|over|about)[^"']*)["']/i);
  if (contactLinkMatch) {
    let contactUrl = contactLinkMatch[1];
    if (contactUrl.startsWith("/")) {
      const u = new URL(homepage);
      contactUrl = `${u.protocol}//${u.host}${contactUrl}`;
    } else if (!contactUrl.startsWith("http")) {
      contactUrl = `${homepage.replace(/\/$/, "")}/${contactUrl}`;
    }
    const contactHtml = await fetchHtml(contactUrl);
    if (contactHtml) {
      const contactData = extractFromHtml(contactHtml, contactUrl);
      pagesScraped.push(contactUrl);
      // Prefer contact-page values for contact-related fields
      homeData.phone = findFirst(contactData.phone, homeData.phone);
      homeData.email = findFirst(contactData.email, homeData.email);
      homeData.whatsapp = findFirst(contactData.whatsapp, homeData.whatsapp);
      homeData.address = findFirst(contactData.address, homeData.address);
    }
  }

  homeData.scraped_at = new Date().toISOString();
  homeData.scraped_pages = pagesScraped;

  // Merge with existing enrichment, new scrape wins for non-empty fields
  const existing = (lead.enrichment ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...existing };
  for (const [k, v] of Object.entries(homeData)) {
    if (v !== undefined && v !== null && (typeof v !== "string" || v.length > 0)) {
      merged[k] = v;
    }
  }

  try {
    await sql`
      UPDATE leads
      SET enrichment = ${JSON.stringify(merged)}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (err) {
    console.error("[scrape] DB update failed:", err);
    return NextResponse.json({
      ok: false,
      error: "Opslaan mislukt: " + (err instanceof Error ? err.message : String(err)),
      data: homeData,
    }, { status: 500 });
  }

  // Invalidate the lead detail page cache so the next render shows fresh data
  revalidatePath(`/dashboard/leads/${id}`);

  return NextResponse.json({
    ok: true,
    data: homeData,
    pagesScraped,
    fieldsFound: Object.keys(homeData).filter((k) => k !== "scraped_at" && k !== "scraped_pages").length,
  });
}
