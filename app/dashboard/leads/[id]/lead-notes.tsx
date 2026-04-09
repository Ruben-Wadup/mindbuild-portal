"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeadNotes({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-white">Opmerkingen</CardTitle>
        {saved && <span className="text-xs text-[#00D4AA]">Opgeslagen</span>}
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Voeg een opmerking toe..."
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/30 transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 hover:bg-[#00D4AA]/20 disabled:opacity-50 transition-colors"
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </CardContent>
    </Card>
  );
}
