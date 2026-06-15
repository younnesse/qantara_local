"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Provider } from "@/lib/constants"
import { VerificationBadge } from "@/components/marketplace/verification-badge"

interface GigCardProps {
  provider: Provider
  className?: string
}

export function GigCard({ provider, className }: GigCardProps) {
  const { t, formatNumber } = useLanguage()
  
  // Find minimum price or use first service price
  const prices = provider.services?.map(s => s.price).filter(p => p !== null && p !== undefined) as number[]
  const minPrice = prices && prices.length > 0 ? Math.min(...prices) : null

  return (
    <Link href={`/consumer/provider-details/${provider.id}`} className={cn("block h-full", className)}>
      <div className="group flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={provider.image || "/placeholder-provider.jpg"}
            alt={provider.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1000px) 50vw, 25vw"
          />
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-2.5">
            {/* Seller row */}
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={provider.image} alt={provider.name} className="object-cover" />
                <AvatarFallback className="text-[10px] font-bold">
                  {provider.name?.[0]?.toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-foreground truncate hover:text-primary transition-colors">
                    {provider.name}
                  </p>
                  <div className="scale-75 origin-top-left -mt-0.5">
                    <VerificationBadge provider={provider} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0" dir="ltr">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-foreground">
                  {provider.rating.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({formatNumber(provider.reviewCount)})
                </span>
              </div>
            </div>

            {/* Title / Description */}
            <h3 className="text-sm font-medium text-foreground/90 line-clamp-2 min-h-[2.5rem] leading-snug">
              {provider.title || provider.bio || "Professional Service"}
            </h3>
          </div>

          {/* Pricing Row */}
          <div className="pt-2.5 border-t border-border/60 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                {t("provider.from")}
              </span>
              {provider.location && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex items-center gap-0.5 max-w-[80px] truncate">
                  <MapPin className="w-2.5 h-2.5 text-muted-foreground/80 shrink-0" />
                  <span className="truncate">{provider.location}</span>
                </span>
              )}
            </div>
            <div className="text-right">
              {minPrice !== null ? (
                <span className="text-sm font-bold text-foreground" dir="ltr">
                  {formatNumber(minPrice)} DZD
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
