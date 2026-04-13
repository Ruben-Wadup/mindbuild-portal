import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: "Geen sessie ID" }, { status: 400 });
  }

  // CASCADE deletes chat_messages automatically
  await sql`DELETE FROM chat_sessions WHERE session_id = ${sessionId}`;

  return NextResponse.json({ ok: true });
}
