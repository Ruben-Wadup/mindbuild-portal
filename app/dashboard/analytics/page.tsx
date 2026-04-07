import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/50 text-sm mt-1">Google Analytics 4 & Search Console</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#00D4AA]" />
            Google API koppeling vereist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/60 text-sm leading-relaxed">
            Om Analytics data te tonen, moet je een Google Cloud service account instellen en koppelen aan GA4 en Search Console.
          </p>

          <div className="bg-[#0f2027] rounded-xl p-5 space-y-4">
            <p className="text-xs font-bold text-[#00D4AA] uppercase tracking-wide">Setup stappen</p>
            <ol className="space-y-3 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-white font-medium">Google Cloud project aanmaken</p>
                  <p className="text-white/50 text-xs mt-0.5">Ga naar console.cloud.google.com → nieuw project &quot;MindBuild Portal&quot;</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-white font-medium">APIs inschakelen</p>
                  <p className="text-white/50 text-xs mt-0.5">Enable: &quot;Google Analytics Data API&quot; + &quot;Search Console API&quot;</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-white font-medium">Service account aanmaken</p>
                  <p className="text-white/50 text-xs mt-0.5">IAM &amp; Admin → Service Accounts → maak aan → download JSON sleutel</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-white font-medium">Toegang verlenen</p>
                  <p className="text-white/50 text-xs mt-0.5">In GA4: Admin → Gebruikers → voeg service account e-mail toe (Viewer)<br />In Search Console: Instellingen → voeg service account toe</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
                <div>
                  <p className="text-white font-medium">Env vars toevoegen op Coolify</p>
                  <p className="text-white/50 text-xs mt-0.5 font-mono">GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GA4_PROPERTY_ID</p>
                </div>
              </li>
            </ol>
          </div>

          <p className="text-white/30 text-xs">
            Na het uitvoeren van deze stappen implementeren we de GA4 charts en Search Console query tabel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
