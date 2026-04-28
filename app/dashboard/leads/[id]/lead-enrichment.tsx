import { Phone, Mail, MapPin, Globe, Link2, Camera, MessageCircle, Briefcase, Music, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Enrichment {
  business_name?: string;
  tagline?: string;
  description?: string;
  language?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  linkedin_company?: string;
  linkedin_personal?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  industry_hints?: string[];
  scraped_at?: string;
}

export function LeadEnrichment({ enrichment }: { enrichment: Enrichment | string | null }) {
  // Defensive: enrichment can be a string if DB stored a JSON-encoded string
  // (from an earlier serialization bug). Try to parse, otherwise bail out.
  let data: Enrichment | null = null;
  if (typeof enrichment === "string") {
    try {
      const parsed = JSON.parse(enrichment);
      data = (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : null;
    } catch {
      data = null;
    }
  } else if (enrichment && typeof enrichment === "object" && !Array.isArray(enrichment)) {
    data = enrichment;
  }
  if (!data || Object.keys(data).length === 0) return null;
  const enr: Enrichment = data;

  const contactItems = [
    enr.phone && {
      icon: <Phone className="w-4 h-4" />, label: "Telefoon",
      value: enr.phone,
      href: `tel:${enr.phone.replace(/\s/g, "")}`,
    },
    enr.whatsapp && {
      icon: <MessageCircle className="w-4 h-4" />, label: "WhatsApp",
      value: `+${enr.whatsapp}`,
      href: `https://wa.me/${enr.whatsapp}`,
    },
    enr.email && {
      icon: <Mail className="w-4 h-4" />, label: "E-mail",
      value: enr.email,
      href: `mailto:${enr.email}`,
    },
    enr.address && {
      icon: <MapPin className="w-4 h-4" />, label: "Adres",
      value: enr.address,
      href: `https://www.google.com/maps/search/${encodeURIComponent(enr.address)}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[];

  const socialItems = [
    enr.linkedin_company && {
      icon: <Briefcase className="w-4 h-4" />, label: "LinkedIn (bedrijf)",
      value: enr.linkedin_company.replace(/^https?:\/\/(www\.|nl\.)?linkedin\.com\//, ""),
      href: enr.linkedin_company,
    },
    enr.linkedin_personal && {
      icon: <Link2 className="w-4 h-4" />, label: "LinkedIn (persoon)",
      value: enr.linkedin_personal.replace(/^https?:\/\/(www\.|nl\.)?linkedin\.com\//, ""),
      href: enr.linkedin_personal,
    },
    enr.instagram && {
      icon: <Camera className="w-4 h-4" />, label: "Instagram",
      value: enr.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@"),
      href: enr.instagram,
    },
    enr.facebook && {
      icon: <Globe className="w-4 h-4" />, label: "Facebook",
      value: enr.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, ""),
      href: enr.facebook,
    },
    enr.twitter && {
      icon: <MessageCircle className="w-4 h-4" />, label: "X / Twitter",
      value: enr.twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, "@"),
      href: enr.twitter,
    },
    enr.youtube && {
      icon: <Video className="w-4 h-4" />, label: "YouTube",
      value: enr.youtube.replace(/^https?:\/\/(www\.)?youtube\.com\//, ""),
      href: enr.youtube,
    },
    enr.tiktok && {
      icon: <Music className="w-4 h-4" />, label: "TikTok",
      value: enr.tiktok.replace(/^https?:\/\/(www\.)?tiktok\.com\//, ""),
      href: enr.tiktok,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[];

  const hasIdentity = enr.business_name || enr.tagline || enr.description;
  const hasContact = contactItems.length > 0;
  const hasSocial = socialItems.length > 0;
  const hasIndustry = enr.industry_hints && enr.industry_hints.length > 0;

  if (!hasIdentity && !hasContact && !hasSocial && !hasIndustry) return null;

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-white">Bedrijfsinformatie</CardTitle>
          {enr.scraped_at && (
            <span className="text-[10px] text-white/30 font-mono">
              {new Date(enr.scraped_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity */}
        {hasIdentity && (
          <div className="space-y-1.5">
            {enr.business_name && (
              <p className="text-base font-bold text-white">{enr.business_name}</p>
            )}
            {enr.tagline && (
              <p className="text-sm text-white/70 italic">{enr.tagline}</p>
            )}
            {enr.description && (
              <p className="text-xs text-white/50 leading-relaxed">{enr.description}</p>
            )}
          </div>
        )}

        {/* Industry hints */}
        {hasIndustry && (
          <div className="flex flex-wrap gap-1.5">
            {enr.industry_hints!.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA]/80 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Contact */}
        {hasContact && (
          <div className="space-y-2 pt-1 border-t border-white/5">
            {contactItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-[#00D4AA]/60 flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-white/40">{item.label}</p>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/85 hover:text-[#00D4AA] transition-colors truncate block"
                  >
                    {item.value}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Socials */}
        {hasSocial && (
          <div className="space-y-2 pt-1 border-t border-white/5">
            {socialItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-white/40 flex-shrink-0">{item.icon}</span>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-[#00D4AA] transition-colors truncate"
                >
                  {item.value}
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
