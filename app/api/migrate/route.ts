import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db";

async function migrate() {
  try {
    await runMigrations();
    return NextResponse.json({ ok: true, message: "Migraties uitgevoerd." });
  } catch (err) {
    console.error("[migrate]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return migrate();
}

export async function POST() {
  return migrate();
}
