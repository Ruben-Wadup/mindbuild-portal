import { generateTotpUri } from "@/lib/totp";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SetupTotpPage() {
  if (!(await getSession())) redirect("/login");

  const totpSecret = process.env.TOTP_SECRET;

  if (!totpSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2027]">
        <div className="text-center text-white/50 space-y-2">
          <p className="font-semibold text-white">TOTP_SECRET niet ingesteld</p>
          <p className="text-sm">Voeg <code className="bg-white/10 px-1 rounded">TOTP_SECRET</code> toe aan de Coolify environment variables.</p>
        </div>
      </div>
    );
  }

  const uri = generateTotpUri(totpSecret, "ruben@mindbuild.nl");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}&bgcolor=0f2027&color=00D4AA&margin=10`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#00D4AA] mb-2">2FA Setup</p>
          <h1 className="text-2xl font-extrabold text-white">
            Mind<span className="text-[#00D4AA]">Build</span>
          </h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Authenticator instellen</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Scan de QR-code met Google Authenticator of Authy. Na het scannen vraagt het portal bij elke login op een nieuw apparaat om een code.
            </p>
          </div>

          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="TOTP QR code"
              width={200}
              height={200}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wide">Handmatige invoer (als QR niet werkt)</p>
            <code className="block text-xs text-[#00D4AA] bg-white/5 rounded-lg px-3 py-2 break-all font-mono">
              {totpSecret}
            </code>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-400 leading-relaxed">
              Sla de bovenstaande code op een veilige plek op. Als je je telefoon verliest, heb je hem nodig om in te loggen.
            </p>
          </div>

          <a
            href="/dashboard"
            className="block w-full text-center py-2 rounded-lg bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20 hover:bg-[#00D4AA]/20 transition-colors text-sm font-medium"
          >
            Klaar — ga naar dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
