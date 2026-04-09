"use client";

import { useState } from "react";

const STAGES = [
  { key: "prospect",           label: "Prospect",            color: "text-white/60" },
  { key: "in_bespreking",      label: "In bespreking",       color: "text-blue-400" },
  { key: "in_onderhandeling",  label: "In onderhandeling",   color: "text-yellow-400" },
  { key: "offerte_verstuurd",  label: "Offerte verstuurd",   color: "text-orange-400" },
  { key: "gewonnen",           label: "Gewonnen",            color: "text-[#00D4AA]" },
  { key: "verloren",           label: "Verloren",            color: "text-red-400" },
];

export function LeadStageEditor({
  leadId,
  initialStage,
  initialDealValue,
}: {
  leadId: string;
  initialStage: string | null;
  initialDealValue: number | null;
}) {
  const [stage, setStage] = useState(initialStage ?? "prospect");
  const [dealValue, setDealValue] = useState(
    initialDealValue != null ? String(initialDealValue) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = STAGES.find((s) => s.key === stage) ?? STAGES[0];

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        deal_value: dealValue !== "" ? parseFloat(dealValue) : null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Fase &amp; waarde</h3>
        {saved && <span className="text-xs text-[#00D4AA]">Opgeslagen</span>}
      </div>

      {/* Stage dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wide">Fase</label>
        <div className="relative">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/30 transition-colors pr-8 cursor-pointer"
            style={{ color: current.color === "text-white/60" ? "rgba(255,255,255,0.6)" : undefined }}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key} className="bg-[#0f2027] text-white">
                {s.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
        </div>
      </div>

      {/* Deal value */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wide">Waarde (€)</label>
        <input
          type="number"
          min="0"
          step="50"
          value={dealValue}
          onChange={(e) => setDealValue(e.target.value)}
          placeholder="bijv. 1500"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/30 transition-colors"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 hover:bg-[#00D4AA]/20 disabled:opacity-50 transition-colors"
      >
        {saving ? "Opslaan..." : "Opslaan"}
      </button>
    </div>
  );
}
