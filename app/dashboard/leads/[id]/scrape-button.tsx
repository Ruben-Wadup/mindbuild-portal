"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

type Result =
  | { ok: true; data: Record<string, unknown>; pagesScraped: string[]; fieldsFound: number }
  | { ok: false; error: string };

export function ScrapeButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleClick() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/scrape`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        router.refresh();
        // Belt-and-braces: also do a hard reload after a short pause so user
        // definitely sees the updated Bedrijfsinformatie card
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setResult({ ok: false, error: "Verzoek mislukt." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Website scrapen</p>
          <p className="text-xs text-white/40 mt-0.5">
            Haal bedrijfsnaam, beschrijving, contactgegevens, socials en branche-hints op uit de homepage en /contact pagina.
          </p>
        </div>
        <button
          onClick={handleClick}
          disabled={busy}
          className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00D4AA]/15 hover:bg-[#00D4AA]/25 border border-[#00D4AA]/30 text-[#00D4AA] text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Scrapen…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" /> Scrape
            </>
          )}
        </button>
      </div>

      {result && result.ok && (
        <div className="rounded-lg bg-[#00D4AA]/10 border border-[#00D4AA]/30 p-3 space-y-2">
          <p className="text-xs text-[#00D4AA] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Scrape voltooid — {result.fieldsFound} velden gevonden op {result.pagesScraped.length} pagina&#39;s
          </p>
          <p className="text-[11px] text-white/40">
            Pagina wordt herladen met de nieuwe data…
          </p>
        </div>
      )}

      {result && !result.ok && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{result.error}</p>
        </div>
      )}
    </div>
  );
}
