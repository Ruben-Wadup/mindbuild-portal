import sql from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Zap, Mail } from "lucide-react";

async function getStats() {
  try {
    const [total] = await sql`SELECT COUNT(*) as count FROM leads`;
    const [today] = await sql`
      SELECT COUNT(*) as count FROM leads
      WHERE created_at >= CURRENT_DATE
    `;
    const [avgScore] = await sql`
      SELECT ROUND(AVG(score)) as avg FROM leads
      WHERE score IS NOT NULL
    `;
    const [geoScans] = await sql`
      SELECT COUNT(*) as count FROM leads WHERE source = 'geo_scan'
    `;
    return {
      total: Number(total.count),
      today: Number(today.count),
      avgScore: Number(avgScore.avg) || 0,
      geoScans: Number(geoScans.count),
    };
  } catch {
    return { total: 0, today: 0, avgScore: 0, geoScans: 0 };
  }
}

async function getRecentLeads() {
  try {
    return await sql`
      SELECT id, email, url, score, source, status, created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT 5
    `;
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  day3_sent: "bg-yellow-500/20 text-yellow-400",
  day7_sent: "bg-orange-500/20 text-orange-400",
  converted: "bg-[#00D4AA]/20 text-[#00D4AA]",
  lost: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  new: "Nieuw",
  day3_sent: "Dag 3 verzonden",
  day7_sent: "Dag 7 verzonden",
  converted: "Klant",
  lost: "Verloren",
};

export default async function DashboardPage() {
  const stats = await getStats();
  const recentLeads = await getRecentLeads();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overzicht</h1>
        <p className="text-white/50 text-sm mt-1">MindBuild Portal — leads en statistieken</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Totaal leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Vandaag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats.today}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Gem. GEO score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#00D4AA]">
              {stats.avgScore > 0 ? `${stats.avgScore}` : "—"}
              {stats.avgScore > 0 && <span className="text-base text-white/40">/100</span>}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              GEO scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{stats.geoScans}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Recente leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">Nog geen leads. Stuur een GEO scan in om te beginnen.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <a
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.email}</p>
                    {lead.url && (
                      <p className="text-xs text-white/40 truncate">{lead.url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {lead.score != null && (
                      <span className="text-xs font-bold text-[#00D4AA]">{lead.score}/100</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] ?? "bg-white/10 text-white/40"}`}>
                      {statusLabels[lead.status] ?? lead.status}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
