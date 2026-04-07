import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
});

export default sql;

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT NOT NULL,
      naam        TEXT,
      bedrijf     TEXT,
      url         TEXT,
      score       INTEGER,
      bericht     TEXT,
      onderwerp   TEXT,
      source      TEXT NOT NULL DEFAULT 'geo_scan',
      status      TEXT NOT NULL DEFAULT 'new',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
