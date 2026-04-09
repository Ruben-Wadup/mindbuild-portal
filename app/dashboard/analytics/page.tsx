export const dynamic = 'force-dynamic';

import { fetchGa4, fetchSearchConsole, type Ga4Summary, type GscQuery } from "@/lib/google";
import sql from "@/lib/db";
import { BarChart2, Search, BookOpen, AlertCircle } from "lucide-react";

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

// ---- page -------------------------------------------------------------------

export default async function AnalyticsPage() {
  const hasGoogle =
    !!process.env.GOOGLE_CLIENT_EMAIL &&
    !!process.env.GOOGLE_PRIVATE_KEY &&
    !!process.env.GA4_PROPERTY_ID;

  let ga4: Ga4Summary | null = null;
  let gsc: GscQuery[] | null = null;
  let ga4Error: string | null = null;
  let gscError: string | null = null;

  if (hasGoogle) {
    const [ga4Result, gscResult] = await Promise.allSettled([
      fetchGa4(28),
      fetchSearchConsole(28),
    ]);
    if (ga4Result.status === "fulfilled") ga4 = ga4Result.value;
    else ga4Error = (ga4Result.reason as Error).message;
    if (gscResult.status === "fulfilled") gsc = gscResult.value;
    else gscError = (gscResult.reason as Error).message;
  }

  const blogRows = await sql<{ slug: string; title: string; views: number; last_viewed: string }[]>`
    SELECT slug, title, views, last_viewed FROM blog_stats ORDER BY views DESC LIMIT 10
  `;

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-1">Laatste 28 dagen · Google Analytics 4 + Search Console</p>
      </div>

      {/* Setup notice */}
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
