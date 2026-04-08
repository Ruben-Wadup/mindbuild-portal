import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const items = await sql`
      SELECT id, title, type, status, geplande_datum, notities, created_at
      FROM content_items
      ORDER BY
        CASE status
          WHEN 'bezig'        THEN 1
          WHEN 'gepland'      THEN 2
          WHEN 'idee'         THEN 3
          WHEN 'gepubliceerd' THEN 4
          ELSE 5
        END,
        geplande_datum ASC NULLS LAST,
        created_at DESC
    `;
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, type, status, geplande_datum, notities } = await req.json();
    if (!title) return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });

    const [item] = await sql`
      INSERT INTO content_items (title, type, status, geplande_datum, notities)
      VALUES (
        ${title},
        ${type ?? "blog"},
        ${status ?? "idee"},
        ${geplande_datum ?? null},
        ${notities ?? null}
      )
      RETURNING id, title, type, status, geplande_datum, notities, created_at
    `;
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
