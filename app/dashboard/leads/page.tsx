import Link from "next/link";
import sql from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  day3_sent: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  day7_sent: "bg-orange-500/20 text-orange-400 border-orange-500/20",
  converted: "bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/20",
  lost: "bg-red-500/20 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  new: "Nieuw",
  day3_sent: "Dag 3 verzonden",
  day7_sent: "Dag 7 verzonden",
  converted: "Klant",
  lost: "Verloren",
};

const sourceLabels: Record<string, string> = {
  geo_scan: "GEO Scan",
  contact_form: "Contactform",
};

async function getLeads() {
  try {
    return await sql`
      SELECT id, email, naam, bedrijf, url, score, source, status, onderwerp, created_at
      FROM leads
      ORDER BY created_at DESC
    `;
  } catch {
    return [];
  }
}

function scoreColor(score: number | null) {
  if (score == null) return "text-white/30";
  if (score >= 80) return "text-[#00D4AA]";
  if (score >= 60) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-white/50 text-sm mt-1">{leads.length} lead{leads.length !== 1 ? "s" : ""} totaal</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Alle leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="text-white/40 text-sm p-6 text-center">Nog geen leads ontvangen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-white/40 font-medium px-6 py-3">Email</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">URL / Bedrijf</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Score</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Bron</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/leads/${lead.id}`} className="text-white hover:text-[#00D4AA] transition-colors font-medium">
                          {lead.email}
                        </Link>
                        {lead.naam && <p className="text-xs text-white/40">{lead.naam}</p>}
                      </td>
                      <td className="px-4 py-3 text-white/60 max-w-[160px] truncate">
                        {lead.url ?? lead.bedrijf ?? <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${scoreColor(lead.score)}`}>
                          {lead.score != null ? `${lead.score}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/50">
                          {sourceLabels[lead.source] ?? lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${statusColors[lead.status] ?? "bg-white/10 text-white/40"}`}>
                          {statusLabels[lead.status] ?? lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
