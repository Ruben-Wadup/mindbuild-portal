/**
 * Google Ads Reporting — portal analytics
 * Gebruikt OAuth2 refresh token + Google Ads API v20 REST
 *
 * Vereiste env vars (instellen in Coolify voor mindbuild-portal):
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_REFRESH_TOKEN
 *   GOOGLE_ADS_CUSTOMER_ID        (bijv. 6294898947)
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID  (bijv. 7948083197)
 */

export type CampaignMetrics = {
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  costEur: number;
  conversions: number;
  ctr: number;
  avgCpcEur: number;
};

export type GoogleAdsSummary = {
  campaigns: CampaignMetrics[];
  totals: {
    impressions: number;
    clicks: number;
    costEur: number;
    conversions: number;
  };
  period: string;
};

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`OAuth token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export async function fetchGoogleAdsCampaigns(days = 7): Promise<GoogleAdsSummary> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!customerId || !loginCustomerId || !developerToken) {
    throw new Error("Google Ads env vars niet geconfigureerd");
  }

  const accessToken = await getAccessToken();

  const period = days === 7 ? "LAST_7_DAYS" : days === 30 ? "LAST_30_DAYS" : "LAST_7_DAYS";

  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING ${period}
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.impressions DESC
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": loginCustomerId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Ads API fout ${res.status}: ${err}`);
  }

  const data = await res.json();
  const rows = (data.results ?? []) as Record<string, Record<string, unknown>>[];

  const campaigns: CampaignMetrics[] = rows.map((row) => {
    const m = (row.metrics ?? {}) as Record<string, number>;
    const c = (row.campaign ?? {}) as Record<string, string>;
    return {
      campaignName: c.name ?? "—",
      status: c.status ?? "UNKNOWN",
      impressions: Number(m.impressions ?? 0),
      clicks: Number(m.clicks ?? 0),
      costEur: Number(m.costMicros ?? 0) / 1_000_000,
      conversions: Number(m.conversions ?? 0),
      ctr: Number(m.ctr ?? 0) * 100,
      avgCpcEur: Number(m.averageCpc ?? 0) / 1_000_000,
    };
  });

  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      costEur: acc.costEur + c.costEur,
      conversions: acc.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, costEur: 0, conversions: 0 }
  );

  return { campaigns, totals, period };
}
