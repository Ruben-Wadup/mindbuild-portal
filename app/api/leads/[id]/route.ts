import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`;

  if (!lead) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, notes, stage, deal_value } = body;

  const [lead] = await sql`
    UPDATE leads
    SET
      status      = COALESCE(${status ?? null}, status),
      notes       = COALESCE(${notes !== undefined ? notes : null}, notes),
      stage       = COALESCE(${stage ?? null}, stage),
      deal_value  = COALESCE(${deal_value !== undefined ? deal_value : null}, deal_value),
      updated_at  = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(lead ?? { error: "Niet gevonden" });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
