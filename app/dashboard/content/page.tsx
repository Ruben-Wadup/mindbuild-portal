"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  geplande_datum: string | null;
  notities: string | null;
  created_at: string;
};

const STATUSES = [
  { key: "idee",         label: "Idee",         color: "bg-white/10 text-white/50",                    dot: "bg-white/30" },
  { key: "gepland",      label: "Gepland",       color: "bg-blue-500/15 text-blue-400",                 dot: "bg-blue-400" },
  { key: "bezig",        label: "Bezig",         color: "bg-yellow-500/15 text-yellow-400",             dot: "bg-yellow-400" },
  { key: "gepubliceerd", label: "Gepubliceerd",  color: "bg-[#00D4AA]/15 text-[#00D4AA]",               dot: "bg-[#00D4AA]" },
];

const TYPES = ["blog", "social", "email", "video", "anders"];

const TYPE_LABELS: Record<string, string> = {
  blog: "Blog", social: "Social", email: "E-mail", video: "Video", anders: "Anders",
};

const NEXT_STATUS: Record<string, string> = {
  idee: "gepland", gepland: "bezig", bezig: "gepubliceerd", gepubliceerd: "gepubliceerd",
};

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "blog", status: "idee", geplande_datum: "", notities: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/content");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          geplande_datum: form.geplande_datum || null,
          notities: form.notities || null,
        }),
      });
      if (res.ok) {
        setForm({ title: "", type: "blog", status: "idee", geplande_datum: "", notities: "" });
        setShowForm(false);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(item: ContentItem) {
    const next = NEXT_STATUS[item.status];
    if (next === item.status) return;
    await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Item verwijderen?")) return;
    await fetch(`/api/content/${id}`, { method: "DELETE" });
    await load();
  }

  const grouped = STATUSES.map((s) => ({
    ...s,
    items: items.filter((i) => i.status === s.key),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content kalender</h1>
          <p className="text-white/50 text-sm mt-1">{items.length} item{items.length !== 1 ? "s" : ""} totaal</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm font-semibold text-[#0f2027] bg-[#00D4AA] px-4 py-2 rounded-lg hover:bg-[#00b891] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw item
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="bg-white/5 border-[#00D4AA]/30">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Nieuw content item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-white/50 mb-1.5">Titel *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Bijv. Blog: AI automatisering voor boekhouders"
                  className="w-full text-sm text-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#00D4AA] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-sm text-white bg-[#0f2027] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#00D4AA] transition-colors"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full text-sm text-white bg-[#0f2027] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#00D4AA] transition-colors"
                >
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Geplande datum</label>
                <input
                  type="date"
                  value={form.geplande_datum}
                  onChange={(e) => setForm({ ...form, geplande_datum: e.target.value })}
                  className="w-full text-sm text-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#00D4AA] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Notities</label>
                <input
                  value={form.notities}
                  onChange={(e) => setForm({ ...form, notities: e.target.value })}
                  placeholder="Trefwoorden, invalshoek, bronnen..."
                  className="w-full text-sm text-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#00D4AA] transition-colors"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 text-sm font-semibold text-[#0f2027] bg-[#00D4AA] px-4 py-2 rounded-lg hover:bg-[#00b891] transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Toevoegen
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-white/40 hover:text-white/60 px-4 py-2 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Status columns */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{group.label}</span>
                <span className="ml-auto text-xs text-white/30 font-mono">{group.items.length}</span>
              </div>

              {/* Items */}
              <div className="space-y-2 min-h-[60px]">
                {group.items.length === 0 && (
                  <div className="border border-dashed border-white/5 rounded-xl h-16 flex items-center justify-center">
                    <span className="text-xs text-white/20">Leeg</span>
                  </div>
                )}
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white leading-snug flex-1">{item.title}</p>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-medium">
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      {item.geplande_datum && (
                        <span className="text-[10px] text-white/30">
                          {new Date(item.geplande_datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>

                    {item.notities && (
                      <p className="text-xs text-white/35 leading-relaxed">{item.notities}</p>
                    )}

                    {group.key !== "gepubliceerd" && (
                      <button
                        onClick={() => advanceStatus(item)}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-[#00D4AA] transition-colors font-medium"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Naar {STATUSES.find((s) => s.key === NEXT_STATUS[group.key])?.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
