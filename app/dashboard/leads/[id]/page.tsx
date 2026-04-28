export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import sql from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { LeadNotes } from "./lead-notes";
import { DeleteLeadButton } from "./delete-lead-button";
import { LeadStageEditor } from "./lead-stage-editor";
import { LeadEnrichment } from "./lead-enrichment";
import { WhatsappButton } from "./whatsapp-button";
import { ScrapeButton } from "./scrape-button";

const statusLabels: Record<string, string> = {
  new: "Nieuw",
  day3_sent: "Dag 3 verzonden",
  day7_sent: "Dag 7 verzonden",
  converted: "Klant",
  lost: "Verloren",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  day3_sent: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  day7_sent: "bg-orange-500/20 text-orange-400 border-orange-500/20",
  converted: "bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/20",
  lost: "bg-red-500/20 text-red-400 border-red-500/20",
};

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  optional?: boolean;
  optInRequired?: boolean;
};

const STATUS_ORDER = ["new", "wa_sent", "day3_sent", "day7_sent", "converted", "lost"];

function getStepState(stepKey: string, currentStatus: string) {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "pending";
}

function buildTimeline(whatsappOptin: boolean): TimelineStep[] {
  const steps: TimelineStep[] = [
    { key: "new", label: "Scan rapport verstuurd", description: "Initieel rapport per e-mail (Resend)" },
  ];
  if (whatsappOptin) {
    steps.push({
      key: "wa_sent",
      label: "Dag 2 WhatsApp",
      description: "Click-to-chat push naar Ruben — alleen bij opt-in",
      optInRequired: true,
    });
  }
  steps.push(
    { key: "day3_sent", label: "Dag 3 follow-up", description: "Follow-up e-mail" },
    { key: "day7_sent", label: "Dag 7 follow-up", description: "Afsluitende e-mail" },
  );
  return steps;
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`;

  if (!lead) notFound();

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Back */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">{lead.email}</h1>
          {lead.naam && <p className="text-white/50 text-sm mt-0.5">{lead.naam}{lead.bedrijf ? ` · ${lead.bedrijf}` : ""}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge className={`text-xs border ${statusColors[lead.status] ?? "bg-white/10 text-white/40"}`}>
            {statusLabels[lead.status] ?? lead.status}
          </Badge>
          <DeleteLeadButton leadId={lead.id} />
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
      <div className="space-y-6 min-w-0">

      {/* Lead info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Lead informatie</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Bron</p>
            <p className="text-white">{lead.source === "geo_scan" ? "GEO Scan" : "Contactformulier"}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Aangemeld</p>
            <p className="text-white">
              {new Date(lead.created_at).toLocaleDateString("nl-NL", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          {lead.url && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Website</p>
              <a href={`https://${lead.url}`} target="_blank" rel="noopener noreferrer" className="text-[#00D4AA] hover:underline">
                {lead.url}
              </a>
            </div>
          )}
          {lead.score != null && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">GEO Score</p>
              <p className="text-2xl font-bold text-[#00D4AA]">
                {lead.score}<span className="text-sm text-white/40">/100</span>
              </p>
            </div>
          )}
          {lead.onderwerp && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Onderwerp</p>
              <p className="text-white">{lead.onderwerp}</p>
            </div>
          )}
          {lead.bericht && (
            <div className="col-span-2">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Bericht</p>
              <p className="text-white/80 text-sm leading-relaxed bg-white/3 rounded-lg p-3">
                {lead.bericht}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage editor */}
      <LeadStageEditor
        leadId={lead.id}
        initialStage={lead.stage ?? "prospect"}
        initialDealValue={lead.deal_value ?? null}
      />

      {/* Notes */}
      <LeadNotes leadId={lead.id} initialNotes={lead.notes ?? null} />

      </div>{/* end left column */}

      {/* Right column — enrichment + actions + timeline */}
      <div className="space-y-6 min-w-0">
        <LeadEnrichment enrichment={lead.enrichment ?? null} />

        {lead.url && (
          <div className="space-y-3">
            <ScrapeButton leadId={lead.id} />
            <WhatsappButton leadId={lead.id} />
          </div>
        )}

      {/* n8n timeline (only for geo_scan leads) */}
      {lead.source === "geo_scan" && (() => {
        const timelineSteps = buildTimeline(!!lead.whatsapp_optin);
        return (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                n8n Follow-up status
                {lead.whatsapp_optin && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                    WA opt-in
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {timelineSteps.map((step, i) => {
                  const state = getStepState(step.key, lead.status);
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          state === "done" ? "bg-[#00D4AA]/20" :
                          state === "active" ? "bg-blue-500/20" :
                          "bg-white/5"
                        }`}>
                          {state === "done" ? (
                            <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />
                          ) : state === "active" ? (
                            <Clock className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        {i < timelineSteps.length - 1 && (
                          <div className={`w-px h-8 mt-1 ${state === "done" ? "bg-[#00D4AA]/30" : "bg-white/10"}`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`text-sm font-medium ${
                          state === "done" ? "text-white" :
                          state === "active" ? "text-blue-300" :
                          "text-white/30"
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      </div>{/* end right column */}
      </div>{/* end grid */}
    </div>
  );
}
