import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

async function getAccessToken(scopes: string[]): Promise<string> {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  if (!rawKey || !clientEmail) {
    throw new Error("GOOGLE_PRIVATE_KEY or GOOGLE_CLIENT_EMAIL not set");
  }

  // Normalize key: handle literal \n from env vars, CRLF, and stray whitespace
  const privateKey = rawKey
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  const key = createPrivateKey(privateKey);
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({ scope: scopes.join(" ") })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Google auth failed: ${data.error}`);
  return data.access_token;
}

export type Ga4Row = {
  date: string;        // "YYYYMMDD"
  sessions: number;
  users: number;
  pageviews: number;
};

export type Ga4Summary = {
  sessions: number;
  users: number;
  pageviews: number;
  avgEngagementRate: number;
  rows: Ga4Row[];
};

export async function fetchGa4(days = 28): Promise<Ga4Summary> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4_PROPERTY_ID not set");

  const token = await getAccessToken([
    "https://www.googleapis.com/auth/analytics.readonly",
  ]);

  const body = {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  };

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    }
  );

  const data = (await res.json()) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
    error?: { message: string };
  };

  if (data.error) throw new Error(`GA4 error: ${data.error.message}`);

  const rows: Ga4Row[] = (data.rows ?? []).map((r) => ({
    date: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value, 10),
    users: parseInt(r.metricValues[1].value, 10),
    pageviews: parseInt(r.metricValues[2].value, 10),
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      sessions: acc.sessions + r.sessions,
      users: acc.users + r.users,
      pageviews: acc.pageviews + r.pageviews,
    }),
    { sessions: 0, users: 0, pageviews: 0 }
  );

  const avgEngagementRate =
    (data.rows ?? []).reduce(
      (sum, r) => sum + parseFloat(r.metricValues[3].value),
      0
    ) / Math.max((data.rows ?? []).length, 1);

  return { ...totals, avgEngagementRate, rows };
}

export type GscQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export async function fetchSearchConsole(days = 28): Promise<GscQuery[]> {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  if (!siteUrl) throw new Error("SEARCH_CONSOLE_SITE_URL not set");

  const token = await getAccessToken([
    "https://www.googleapis.com/auth/webmasters.readonly",
  ]);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const body = {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    dimensions: ["query"],
    rowLimit: 10,
    startRow: 0,
  };

  const encodedUrl = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    }
  );

  const data = (await res.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    error?: { message: string };
  };

  if (data.error) throw new Error(`Search Console error: ${data.error.message}`);

  return (data.rows ?? []).map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));
}
