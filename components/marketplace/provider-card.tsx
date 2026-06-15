"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, Heart, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import type { Provider } from "@/lib/constants"
import { VerificationBadge } from "@/components/marketplace/verification-badge"

interface ProviderCardProps {
  provider: Provider
  className?: string
}

export function ProviderCard({ provider, className }: ProviderCardProps) {
  const { t, formatNumber } = useLanguage()
  const minPrice = provider.services?.length > 0 ? provider.services[0].price : null

  return (
    <Link href={`/consumer/provider-details/${provider.id}`} className={cn("block", className)}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 h-full"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={provider.image || "/placeholder-provider.jpg"}
            alt={provider.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges - Top Left */}
          <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 flex flex-col gap-1.5 z-10 items-start">
            <VerificationBadge provider={provider} />
            {provider.rating >= 4.5 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
                <Star className="w-3 h-3 fill-current" />
                Top
              </span>
            )}
          </div>

          {/* Favorite Button - Top Right */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
            aria-label="Save to favorites"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          {/* Name & Title on image */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1">{provider.name}</h3>
            <p className="text-white/75 text-xs mt-0.5 line-clamp-1">{provider.title}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2.5">
          {/* Rating Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" dir="ltr">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{provider.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({formatNumber(provider.reviewCount)})</span>
            </div>
            {provider.location && (
              <div className="flex items-center gap-0.5 text-[10px] md:text-[11px] text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded-full border border-border/40 shrink-0">
                <MapPin className="w-3 h-3 text-muted-foreground/80" />
                <span>{provider.location}</span>
              </div>
            )}
          </div>

          {/* Service Preview + Price */}
          {provider.services?.[0] && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground line-clamp-1">{provider.services[0].name}</span>
              {minPrice !== null && (
                <span className="font-semibold text-foreground whitespace-nowrap" dir="ltr">{formatNumber(minPrice)} DA</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
