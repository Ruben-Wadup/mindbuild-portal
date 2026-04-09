"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Fout: ${res.status}`);
        setDeleting(false);
        return;
      }
      router.push("/dashboard/leads");
      router.refresh();
    } catch {
      setError("Verzoek mislukt. Probeer opnieuw.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Zeker weten?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Verwijderen..." : "Ja, verwijder"}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            Annuleer
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Verwijder
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
