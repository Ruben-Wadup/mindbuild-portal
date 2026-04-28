"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Result =
  | { ok: true; waNumber: string; waLink: string; message: string }
  | { ok: false; error: string };

export function WhatsappButton({ leadId }: { leadId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleClick() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/whatsapp`, { method: "POST" });
      const data = await res.json();
      setResult(data);
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
          <p className="text-sm font-semibold text-white">WhatsApp deze lead</p>
          <p className="text-xs text-white/40 mt-0.5">
            Scrape website voor mobiel nummer en stuur push naar je iPhone met klikbare link.
          </p>
        </div>
        <button
          onClick={handleClick}
          disabled={busy}
          className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Zoeken…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Stuur push
            </>
          )}
        </button>
      </div>

      {result && result.ok && (
        <div className="rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 p-3 space-y-2">
          <p className="text-xs text-[#25D366] font-semibold">
            ✓ Push verstuurd. Tap je iPhone-melding om WhatsApp te openen.
          </p>
          <p className="text-xs text-white/60">
            Nummer: <span className="font-mono">+{result.waNumber}</span>
          </p>
          <a
            href={result.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#25D366] hover:underline break-all"
          >
            Of klik hier om vanuit deze browser WhatsApp te openen →
          </a>
          <details className="text-xs text-white/50">
            <summary className="cursor-pointer hover:text-white/70">Bekijk bericht</summary>
            <p className="mt-2 italic whitespace-pre-wrap">{result.message}</p>
          </details>
        </div>
      )}

      {result && !result.ok && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-xs text-red-300">{result.error}</p>
        </div>
      )}
    </div>
  );
}
