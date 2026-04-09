const BASE = "https://plausible.io/api/v1";

export interface PlausibleSummary {
  visitors: number;
  pageviews: number;
  bounceRate: number;
  visitDuration: number; // seconds
}

export interface PlausiblePage {
  page: string;
  visitors: number;
  pageviews: number;
}

export interface PlausibleDay {
  date: string;
  visitors: number;
}

async function plausibleFetch(path: string, params: Record<string, string>) {
  const key = process.env.PLAUSIBLE_API_KEY;
  if (!key) throw new Error("PLAUSIBLE_API_KEY not set");

  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Plausible ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchPlausibleSummary(
  siteId: string,
  period = "30d"
): Promise<PlausibleSummary> {
  const data = await plausibleFetch("/stats/aggregate", {
    site_id: siteId,
    period,
    metrics: "visitors,pageviews,bounce_rate,visit_duration",
  });
  const r = data.results;
  return {
    visitors: r.visitors?.value ?? 0,
    pageviews: r.pageviews?.value ?? 0,
    bounceRate: r.bounce_rate?.value ?? 0,
    visitDuration: r.visit_duration?.value ?? 0,
  };
}

export async function fetchPlausibleTimeseries(
  siteId: string,
  period = "30d"
): Promise<PlausibleDay[]> {
  const data = await plausibleFetch("/stats/timeseries", {
    site_id: siteId,
    period,
    metrics: "visitors",
  });
  return (data.results ?? []).map((r: { date: string; visitors: number }) => ({
    date: r.date,
    visitors: r.visitors,
  }));
}

export async function fetchPlausibleTopPages(
  siteId: string,
  period = "30d",
  limit = 10
): Promise<PlausiblePage[]> {
  const data = await plausibleFetch("/stats/breakdown", {
    site_id: siteId,
    period,
    property: "event:page",
    metrics: "visitors,pageviews",
    limit: String(limit),
  });
  return (data.results ?? []).map(
    (r: { page: string; visitors: number; pageviews: number }) => ({
      page: r.page,
      visitors: r.visitors,
      pageviews: r.pageviews,
    })
  );
}
