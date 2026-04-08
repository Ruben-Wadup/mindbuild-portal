import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, type, status, geplande_datum, notities } = body;

    const [item] = await sql`
      UPDATE content_items SET
        title          = COALESCE(${title ?? null}, title),
        type           = COALESCE(${type ?? null}, type),
        status         = COALESCE(${status ?? null}, status),
        geplande_datum = COALESCE(${geplande_datum ?? null}, geplande_datum),
        notities       = COALESCE(${notities ?? null}, notities),
        updated_at     = NOW()
      WHERE id = ${id}
      RETURNING id, title, type, status, geplande_datum, notities
    `;
    if (!item) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM content_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
