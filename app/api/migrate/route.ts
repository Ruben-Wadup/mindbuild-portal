import { NextRequest, NextResponse } from "next/server";
import { runMigrations } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== process.env.PORTAL_SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runMigrations();
    return NextResponse.json({ ok: true, message: "Migraties uitgevoerd." });
  } catch (err) {
    console.error("[migrate]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
