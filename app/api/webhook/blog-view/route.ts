import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { slug, title, category, publishDate } = await req.json();
    if (!slug || !title) {
      return NextResponse.json({ error: "slug en title zijn verplicht." }, { status: 400 });
    }

    await sql`
      INSERT INTO blog_stats (slug, title, category, publish_date, views, last_viewed)
      VALUES (
        ${slug},
        ${title},
        ${category ?? null},
        ${publishDate ?? null},
        1,
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        views       = blog_stats.views + 1,
        last_viewed = NOW(),
        title       = EXCLUDED.title
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[blog-view]", err);
    return NextResponse.json({ error: "Mislukt." }, { status: 500 });
  }
}
