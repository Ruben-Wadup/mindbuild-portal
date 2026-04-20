import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

type ContentItem = {
  id: string;
  title: string;
  notities: string | null;
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pick next blog item that is 'idee' or 'gepland' and whose date is now/past
    const rows = await sql<ContentItem[]>`
      SELECT id, title, notities
      FROM content_items
      WHERE type = 'blog'
        AND status IN ('idee', 'gepland')
        AND (geplande_datum IS NULL OR geplande_datum <= CURRENT_DATE)
      ORDER BY geplande_datum NULLS LAST, created_at ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    const item = rows[0];

    // Mark as 'bezig' so it's not picked again
    await sql`
      UPDATE content_items
      SET status = 'bezig', updated_at = NOW()
      WHERE id = ${item.id}
    `;

    return NextResponse.json({
      found: true,
      id: item.id,
      title: item.title,
      notities: item.notities,
    });
  } catch (err) {
    console.error("blog-pick-topic webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
