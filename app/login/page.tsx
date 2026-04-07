"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Ongeldig wachtwoord. Probeer het opnieuw.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#00D4AA] mb-2">
            Portal
          </p>
          <h1 className="text-2xl font-extrabold text-white">
            Mind<span className="text-[#00D4AA]">Build</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-6">Inloggen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm">
                Wachtwoord
              </Label>
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

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D4AA] hover:bg-[#00b891] text-[#0f2027] font-bold"
            >
              {loading ? "Bezig..." : "Inloggen"}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          MindBuild · portal.mindbuild.nl
        </p>
      </div>
    </div>
  );
}
