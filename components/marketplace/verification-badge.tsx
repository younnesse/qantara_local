import { Badge } from "@/components/ui/badge"
import { Shield, Wrench, Briefcase, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function VerificationBadge({ provider }: { provider: any }) {
  const { t } = useLanguage();
  const isVerified = provider.verified || provider.certificateStatus === "VALID";

  if (!isVerified) {
    return (
      <Badge variant="outline" className="hover:bg-transparent inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {t("provider.verifPending")}
      </Badge>
    );
  }

  const categoryName = provider.professionalCategory?.name || provider.category;

  if (categoryName === 'regulated_profession') {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/10 inline-flex items-center gap-1">
        <Shield className="w-3 h-3" />
        {t("provider.verifiedBy")} {provider.regulatoryBody?.code || "Ordre"}
      </Badge>
    );
  }

  if (categoryName === 'artisan') {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/10 inline-flex items-center gap-1">
        <Wrench className="w-3 h-3" />
        {t("provider.cnamCertified")}
      </Badge>
    );
  }

  if (categoryName === 'auto_entrepreneur') {
    return (
      <Badge className="bg-teal-500/10 text-teal-600 border-teal-200 hover:bg-teal-500/10 inline-flex items-center gap-1">
        <Briefcase className="w-3 h-3" />
        {t("provider.anaeCertified")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/10 inline-flex items-center gap-1">
      <Shield className="w-3 h-3" />
      {t("provider.verifiedProfile")}
    </Badge>
  );
}
