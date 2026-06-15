"use client"

import { ShieldCheck, Users, Sparkles, Lock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function TrustBar() {
  const { t } = useLanguage()

  const items = [
    { icon: ShieldCheck, label: t("trust.verified") },
    { icon: Users, label: t("trust.satisfied") },
    { icon: Sparkles, label: t("trust.aiVerification") },
    { icon: Lock, label: t("trust.authentic") },
  ]

  return (
    <section className="border-y border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 justify-items-center">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left rtl:md:text-right max-w-[240px]">
                <div className="p-2.5 rounded-full bg-primary/5 text-primary shrink-0">
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-foreground/80 leading-snug">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
