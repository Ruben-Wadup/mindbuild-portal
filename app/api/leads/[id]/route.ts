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
  const { status, notes } = await req.json();

  const [lead] = await sql`
    UPDATE leads
    SET
      status = COALESCE(${status ?? null}, status),
      notes = COALESCE(${notes !== undefined ? notes : null}, notes),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(lead);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await sql`DELETE FROM leads WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
