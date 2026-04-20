import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PORTAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content_item_id, status } = await req.json();

    if (!content_item_id) {
      return NextResponse.json({ error: "content_item_id is verplicht" }, { status: 400 });
    }

    const newStatus = status ?? "idee";

    await sql`
      UPDATE content_items
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${content_item_id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("blog-reset-status webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
