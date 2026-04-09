"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [step, setStep] = useState<"password" | "totp">("password");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      window.location.href = "/dashboard";
      return;
    } else if (res.ok && data.requireTotp) {
      setStep("totp");
    } else {
      setError(data.error ?? "Ongeldig wachtwoord.");
    }
    setLoading(false);
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, totpToken, trustDevice }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      window.location.href = "/dashboard";
      return;
    } else {
      setError(data.error ?? "Ongeldige code.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#00D4AA] mb-2">Portal</p>
          <h1 className="text-2xl font-extrabold text-white">
            Mind<span className="text-[#00D4AA]">Build</span>
          </h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {step === "password" ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">Inloggen</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70 text-sm">Wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00D4AA] focus:ring-[#00D4AA]"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00D4AA] hover:bg-[#00b891] text-[#0f2027] font-bold"
                >
                  {loading ? "Bezig..." : "Doorgaan"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Verificatie</h2>
              <p className="text-white/40 text-sm mb-6">
                Open je authenticator app en voer de 6-cijferige code in.
              </p>
              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totp" className="text-white/70 text-sm">Code</Label>
                  <Input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00D4AA] focus:ring-[#00D4AA] text-center text-xl tracking-widest"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border transition-colors ${trustDevice ? "bg-[#00D4AA] border-[#00D4AA]" : "bg-white/5 border-white/20"}`}>
                      {trustDevice && (
                        <svg className="w-3 h-3 text-[#0f2027] absolute top-0.5 left-0.5" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    Vertrouw dit apparaat (30 dagen)
                  </span>
                </label>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading || totpToken.length !== 6}
                  className="w-full bg-[#00D4AA] hover:bg-[#00b891] text-[#0f2027] font-bold disabled:opacity-50"
                >
                  {loading ? "Verifiëren..." : "Inloggen"}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("password"); setError(""); setTotpToken(""); }}
                  className="w-full text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  ← Terug
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          MindBuild · portal.mindbuild.nl
        </p>
      </div>
    </div>
  );
}
