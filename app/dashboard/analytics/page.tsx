export const dynamic = 'force-dynamic';

import { fetchGa4, fetchSearchConsole, type Ga4Summary, type GscQuery } from "@/lib/google";
import { fetchPlausibleSummary, fetchPlausibleTimeseries, fetchPlausibleTopPages, type PlausibleSummary, type PlausibleDay, type PlausiblePage } from "@/lib/plausible";
import { fetchGoogleAdsCampaigns, type GoogleAdsSummary } from "@/lib/google-ads";
import sql from "@/lib/db";
import { BarChart2, Search, BookOpen, AlertCircle, Globe, TrendingUp } from "lucide-react";

// ---- helpers ----------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ rows }: { rows: Ga4Summary["rows"] }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  const W = 560;
  const H = 120;
  const barW = Math.max(Math.floor((W - 32) / rows.length) - 2, 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Sessies per dag">
      {rows.map((r, i) => {
        const barH = Math.max(Math.round((r.sessions / max) * (H - 24)), 2);
        const x = 16 + i * ((W - 32) / rows.length);
        const y = H - 8 - barH;
        return (
          <g key={r.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill="rgba(0,212,170,0.5)"
            />
            <title>{`${r.date.slice(4, 6)}/${r.date.slice(6)}: ${r.sessions} sessies`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function ConfigNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-200/70">{message}</p>
    </div>
  );
}

function PlausibleBarChart({ rows }: { rows: PlausibleDay[] }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.visitors), 1);
  const W = 560;
  const H = 100;
  const barW = Math.max(Math.floor((W - 32) / rows.length) - 2, 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Bezoekers per dag">
      {rows.map((r, i) => {
        const barH = Math.max(Math.round((r.visitors / max) * (H - 16)), 2);
        const x = 16 + i * ((W - 32) / rows.length);
        const y = H - 4 - barH;
        return (
          <g key={r.date}>
            <rect x={x} y={y} width={barW} height={barH} rx="2" fill="rgba(0,212,170,0.45)" />
            <title>{`${r.date}: ${r.visitors} bezoekers`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function PlausibleSection({
  site,
  summary,
  timeseries,
  pages,
}: {
  site: string;
  summary: PlausibleSummary;
  timeseries: PlausibleDay[];
  pages: PlausiblePage[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-[#00D4AA] tracking-widest uppercase">{site}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Bezoekers" value={summary.visitors.toLocaleString("nl")} sub="30 dagen" />
        <StatCard label="Paginaweergaven" value={summary.pageviews.toLocaleString("nl")} />
        <StatCard label="Bouncepercentage" value={`${summary.bounceRate}%`} />
        <StatCard
          label="Gem. bezoekduur"
          value={`${Math.floor(summary.visitDuration / 60)}m ${summary.visitDuration % 60}s`}
        />
      </div>
      {timeseries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <PlausibleBarChart rows={timeseries} />
        </div>
      )}
      {pages.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/30 mb-3">Top pagina&apos;s</p>
          <div className="space-y-1.5">
            {pages.slice(0, 8).map((p) => (
              <div key={p.page} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-white/60 font-mono truncate max-w-[240px]">{p.page}</span>
                <span className="text-[#00D4AA] font-semibold flex-shrink-0">{p.visitors.toLocaleString("nl")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleAdsSection({ data }: { data: GoogleAdsSummary }) {
  const { campaigns, totals } = data;
  const costPerConversion = totals.conversions > 0 ? totals.costEur / totals.conversions : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-[#00D4AA]" />
        Google Ads · Laatste 7 dagen
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Vertoningen" value={totals.impressions.toLocaleString("nl")} />
        <StatCard label="Klikken" value={totals.clicks.toLocaleString("nl")} />
        <StatCard label="Kosten" value={`€${totals.costEur.toFixed(2)}`} />
        <StatCard
          label="Conversies"
          value={totals.conversions.toFixed(1)}
          sub={costPerConversion ? `€${costPerConversion.toFixed(2)} per lead` : undefined}
        />
      </div>

      {campaigns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs border-b border-white/8">
                <th className="text-left pb-2 pr-4 font-normal">Campagne</th>
                <th className="text-right pb-2 px-3 font-normal">Status</th>
                <th className="text-right pb-2 px-3 font-normal">Vertoningen</th>
                <th className="text-right pb-2 px-3 font-normal">Klikken</th>
                <th className="text-right pb-2 px-3 font-normal">CTR</th>
                <th className="text-right pb-2 px-3 font-normal">Gem. CPC</th>
                <th className="text-right pb-2 pl-3 font-normal">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaignName} className="border-b border-white/5 hover:bg-white/3">
                  <td className="py-2.5 pr-4 text-white/70 text-xs truncate max-w-[200px]">{c.campaignName}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-xs font-mono ${c.status === "ENABLED" ? "text-[#00D4AA]" : "text-white/30"}`}>
                      {c.status === "ENABLED" ? "actief" : c.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-white/50 text-xs">{c.impressions.toLocaleString("nl")}</td>
                  <td className="py-2.5 px-3 text-right text-[#00D4AA] font-semibold text-xs">{c.clicks.toLocaleString("nl")}</td>
                  <td className="py-2.5 px-3 text-right text-white/50 text-xs">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right text-white/50 text-xs">€{c.avgCpcEur.toFixed(2)}</td>
                  <td className="py-2.5 pl-3 text-right text-white/70 text-xs font-semibold">€{c.costEur.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- page -------------------------------------------------------------------

export default async function AnalyticsPage() {
  const hasGoogle =
    !!process.env.GOOGLE_CLIENT_EMAIL &&
    !!process.env.GOOGLE_PRIVATE_KEY &&
    !!process.env.GA4_PROPERTY_ID;

  const hasPlausible = !!process.env.PLAUSIBLE_API_KEY;
  const hasGoogleAds =
    !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    !!process.env.GOOGLE_ADS_CLIENT_ID &&
    !!process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    !!process.env.GOOGLE_ADS_CUSTOMER_ID;

  let ga4: Ga4Summary | null = null;
  let gsc: GscQuery[] | null = null;
  let ga4Error: string | null = null;
  let gscError: string | null = null;
  let googleAds: GoogleAdsSummary | null = null;
  let googleAdsError: string | null = null;

  // Plausible data per site
  type PlausibleSiteData = {
    summary: PlausibleSummary;
    timeseries: PlausibleDay[];
    pages: PlausiblePage[];
  };
  const plausibleData: Record<string, PlausibleSiteData> = {};
  let plausibleError: string | null = null;

  const [ga4Result, gscResult, plNlResult, plAeResult, adsResult] = await Promise.allSettled([
    hasGoogle ? fetchGa4(28) : Promise.resolve(null),
    hasGoogle ? fetchSearchConsole(28) : Promise.resolve(null),
    hasPlausible
      ? Promise.all([
          fetchPlausibleSummary("mindbuild.nl"),
          fetchPlausibleTimeseries("mindbuild.nl"),
          fetchPlausibleTopPages("mindbuild.nl"),
        ])
      : Promise.resolve(null),
    hasPlausible
      ? Promise.all([
          fetchPlausibleSummary("mindbuild.ae"),
          fetchPlausibleTimeseries("mindbuild.ae"),
          fetchPlausibleTopPages("mindbuild.ae"),
        ])
      : Promise.resolve(null),
    hasGoogleAds ? fetchGoogleAdsCampaigns(7) : Promise.resolve(null),
  ]);

  if (adsResult.status === "fulfilled" && adsResult.value) googleAds = adsResult.value as GoogleAdsSummary;
  else if (adsResult.status === "rejected") googleAdsError = (adsResult.reason as Error).message;

  if (ga4Result.status === "fulfilled" && ga4Result.value) ga4 = ga4Result.value as Ga4Summary;
  else if (ga4Result.status === "rejected") ga4Error = (ga4Result.reason as Error).message;
  if (gscResult.status === "fulfilled" && gscResult.value) gsc = gscResult.value as GscQuery[];
  else if (gscResult.status === "rejected") gscError = (gscResult.reason as Error).message;

  if (plNlResult.status === "fulfilled" && plNlResult.value) {
    const [summary, timeseries, pages] = plNlResult.value as [PlausibleSummary, PlausibleDay[], PlausiblePage[]];
    plausibleData["mindbuild.nl"] = { summary, timeseries, pages };
  } else if (plNlResult.status === "rejected") {
    plausibleError = (plNlResult.reason as Error).message;
  }
  if (plAeResult.status === "fulfilled" && plAeResult.value) {
    const [summary, timeseries, pages] = plAeResult.value as [PlausibleSummary, PlausibleDay[], PlausiblePage[]];
    plausibleData["mindbuild.ae"] = { summary, timeseries, pages };
  }

  const blogRows = await sql<{ slug: string; title: string; views: number; last_viewed: string }[]>`
    SELECT slug, title, views, last_viewed FROM blog_stats ORDER BY views DESC LIMIT 10
  `;

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Laatste 28-30 dagen · Plausible + Google Analytics 4 + Google Ads</p>
      </div>

      {/* Google Ads */}
      {!hasGoogleAds && (
        <ConfigNotice message="Google Ads koppeling niet actief. Voeg GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID en GOOGLE_ADS_LOGIN_CUSTOMER_ID toe als env vars op Coolify." />
      )}
      {googleAdsError && <ConfigNotice message={`Google Ads fout: ${googleAdsError}`} />}
      {googleAds && <GoogleAdsSection data={googleAds} />}

      {/* Plausible */}
      {!hasPlausible && (
        <ConfigNotice message="Plausible niet actief. Voeg PLAUSIBLE_API_KEY toe als env var op Coolify. Maak een API key aan op plausible.io → Account Settings → API Keys." />
      )}
      {plausibleError && <ConfigNotice message={`Plausible fout: ${plausibleError}`} />}
      {hasPlausible && Object.keys(plausibleData).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-8">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#00D4AA]" />
            Plausible · Cookieloze Analytics
          </p>
          {Object.entries(plausibleData).map(([site, data]) => (
            <PlausibleSection
              key={site}
              site={site}
              summary={data.summary}
              timeseries={data.timeseries}
              pages={data.pages}
            />
          ))}
        </div>
      )}

      {/* Setup notice Google */}
      {!hasGoogle && (
        <ConfigNotice message="Google Analytics koppeling niet actief. Voeg GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GA4_PROPERTY_ID en SEARCH_CONSOLE_SITE_URL toe als env vars op Coolify." />
      )}

      {/* GA4 summary cards */}
      {ga4 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Sessies" value={ga4.sessions.toLocaleString("nl")} sub="28 dagen" />
            <StatCard label="Gebruikers" value={ga4.users.toLocaleString("nl")} sub="actief" />
            <StatCard label="Paginaweergaven" value={ga4.pageviews.toLocaleString("nl")} />
            <StatCard
              label="Engagement rate"
              value={`${Math.round(ga4.avgEngagementRate * 100)}%`}
              sub="gem. per dag"
            />
          </div>

          {/* Bar chart */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-[#00D4AA]" />
              Sessies per dag
            </p>
            <BarChart rows={ga4.rows} />
          </div>
        </>
      )}
      {ga4Error && <ConfigNotice message={`GA4 fout: ${ga4Error}`} />}

      {/* Search Console */}
      {gsc && gsc.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#00D4AA]" />
            Top zoekwoorden · Search Console
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/8">
                  <th className="text-left pb-2 pr-4 font-normal">Query</th>
                  <th className="text-right pb-2 px-3 font-normal">Clicks</th>
                  <th className="text-right pb-2 px-3 font-normal">Impressies</th>
                  <th className="text-right pb-2 px-3 font-normal">CTR</th>
                  <th className="text-right pb-2 pl-3 font-normal">Positie</th>
                </tr>
              </thead>
              <tbody>
                {gsc.map((row) => (
                  <tr key={row.query} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2.5 pr-4 text-white/80 font-mono text-xs truncate max-w-[200px]">{row.query}</td>
                    <td className="py-2.5 px-3 text-right text-[#00D4AA] font-semibold">{row.clicks}</td>
                    <td className="py-2.5 px-3 text-right text-white/50">{row.impressions.toLocaleString("nl")}</td>
                    <td className="py-2.5 px-3 text-right text-white/50">{row.ctr}%</td>
                    <td className="py-2.5 pl-3 text-right text-white/50">#{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {gscError && <ConfigNotice message={`Search Console fout: ${gscError}`} />}

      {/* Blog stats */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#00D4AA]" />
          Blog weergaven · eigen tracking
        </p>
        {blogRows.length === 0 ? (
          <p className="text-sm text-white/30">Nog geen blog views getrackt.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/8">
                  <th className="text-left pb-2 pr-4 font-normal">Artikel</th>
                  <th className="text-right pb-2 px-3 font-normal">Views</th>
                  <th className="text-right pb-2 pl-3 font-normal">Laatste view</th>
                </tr>
              </thead>
              <tbody>
                {blogRows.map((row) => (
                  <tr key={row.slug} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2.5 pr-4 text-white/70 text-xs truncate max-w-[280px]">{row.title}</td>
                    <td className="py-2.5 px-3 text-right text-[#00D4AA] font-semibold">{row.views}</td>
                    <td className="py-2.5 pl-3 text-right text-white/30 text-xs">
                      {new Date(row.last_viewed).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
