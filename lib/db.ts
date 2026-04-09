import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: false,
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
      notes       TEXT,
      source      TEXT NOT NULL DEFAULT 'geo_scan',
      status      TEXT NOT NULL DEFAULT 'new',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'prospect'`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC(10,2)`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment JSONB`;

  await sql`
    CREATE TABLE IF NOT EXISTS blog_stats (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      category    TEXT,
      publish_date DATE,
      views       INTEGER NOT NULL DEFAULT 0,
      last_viewed TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auto_published_posts (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug          TEXT NOT NULL,
      title         TEXT NOT NULL,
      site          TEXT NOT NULL CHECK (site IN ('nl', 'ae')),
      cover_image   TEXT,
      category      TEXT,
      primary_keyword TEXT,
      url           TEXT,
      published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title         TEXT NOT NULL,
      type          TEXT NOT NULL DEFAULT 'blog',
      status        TEXT NOT NULL DEFAULT 'idee',
      geplande_datum DATE,
      notities      TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
