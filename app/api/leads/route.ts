import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");
  const status = searchParams.get("status");

  const leads = source
    ? status
      ? await sql`SELECT * FROM leads WHERE source = ${source} AND status = ${status} ORDER BY created_at DESC`
      : await sql`SELECT * FROM leads WHERE source = ${source} ORDER BY created_at DESC`
    : status
      ? await sql`SELECT * FROM leads WHERE status = ${status} ORDER BY created_at DESC`
      : await sql`SELECT * FROM leads ORDER BY created_at DESC`;

  return NextResponse.json(leads);
}
