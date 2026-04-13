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

  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id    TEXT UNIQUE NOT NULL,
      site          TEXT NOT NULL DEFAULT 'mindbuild.nl',
      first_message TEXT,
      message_count INTEGER NOT NULL DEFAULT 0,
      started_at    TIMESTAMPTZ DEFAULT NOW(),
      last_message_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
      role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id)`;

  // UTM tracking columns on leads
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid TEXT`;

  // Chat lead data columns
  await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT`;
  await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS page_url TEXT`;
  await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS referrer TEXT`;
}
