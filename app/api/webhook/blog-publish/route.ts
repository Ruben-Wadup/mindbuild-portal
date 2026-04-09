import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, title, site, cover_image, category, primary_keyword, url } = await req.json();

    if (!slug || !title || !site) {
      return NextResponse.json({ error: "slug, title en site zijn verplicht" }, { status: 400 });
    }

    const [post] = await sql`
      INSERT INTO auto_published_posts (slug, title, site, cover_image, category, primary_keyword, url)
      VALUES (
        ${slug},
        ${title},
        ${site},
        ${cover_image ?? null},
        ${category ?? null},
        ${primary_keyword ?? null},
        ${url ?? null}
      )
      RETURNING id, slug, title, site, published_at
    `;

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error("blog-publish webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
