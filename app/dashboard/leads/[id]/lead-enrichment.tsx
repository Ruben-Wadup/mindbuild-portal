import { Phone, Linkedin, Instagram, Facebook, Twitter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Enrichment {
  phone?: string;
  linkedin_company?: string;
  linkedin_personal?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export function LeadEnrichment({ enrichment }: { enrichment: Enrichment | null }) {
  if (!enrichment) return null;

  const items = [
    enrichment.phone && {
      icon: <Phone className="w-4 h-4" />,
      label: "Telefoon",
      value: enrichment.phone,
      href: `tel:${enrichment.phone}`,
    },
    enrichment.linkedin_company && {
      icon: <Linkedin className="w-4 h-4" />,
      label: "LinkedIn (bedrijf)",
      value: enrichment.linkedin_company.replace("https://", ""),
      href: enrichment.linkedin_company,
    },
    enrichment.linkedin_personal && {
      icon: <Linkedin className="w-4 h-4" />,
      label: "LinkedIn (persoon)",
      value: enrichment.linkedin_personal.replace("https://", ""),
      href: enrichment.linkedin_personal,
    },
    enrichment.instagram && {
      icon: <Instagram className="w-4 h-4" />,
      label: "Instagram",
      value: enrichment.instagram.replace("https://instagram.com/", "@"),
      href: enrichment.instagram,
    },
    enrichment.facebook && {
      icon: <Facebook className="w-4 h-4" />,
      label: "Facebook",
      value: enrichment.facebook.replace("https://facebook.com/", ""),
      href: enrichment.facebook,
    },
    enrichment.twitter && {
      icon: <Twitter className="w-4 h-4" />,
      label: "X / Twitter",
      value: enrichment.twitter.replace("https://x.com/", "@"),
      href: enrichment.twitter,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[];

  if (items.length === 0) return null;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-white">Bedrijfsinformatie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-[#00D4AA]/60 flex-shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-white/40">{item.label}</p>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/80 hover:text-[#00D4AA] transition-colors truncate block"
              >
                {item.value}
              </a>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
