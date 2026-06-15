"use client"

import { Button } from "@/components/ui/button"
import { Lock, Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import type { Provider } from "@/lib/constants"

interface FloatingCtaProps {
  provider: Provider & { phoneNumber?: string }
  user: any
  minPrice: number | null
}

export function FloatingCta({ provider, user, minPrice }: FloatingCtaProps) {
  const { t, formatNumber } = useLanguage()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border p-4 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Price Info */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("provider.from") || "Starting At"}
          </span>
          {minPrice !== null ? (
            <span className="text-lg font-bold text-foreground">
              {formatNumber(minPrice)} DZD
            </span>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">—</span>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex-1 flex justify-end gap-2">
          {user ? (
            <>
              {provider.phoneNumber && (
                <a href={`tel:${provider.phoneNumber}`} className="flex-1 max-w-[120px]">
                  <Button variant="outline" className="w-full rounded-md gap-1.5 h-11 text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    {t("provider.contact") || "Call"}
                  </Button>
                </a>
              )}
              <Button variant="default" className="flex-1 max-w-[140px] rounded-md gap-1.5 h-11 text-xs font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                {t("provider.getQuote") || "Message"}
              </Button>
            </>
          ) : (
            <Link href="/login" className="w-full max-w-[180px]">
              <Button variant="default" className="w-full rounded-md gap-1.5 h-11 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                {t("provider.contactDetails") || "Login to Contact"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
