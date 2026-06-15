"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SectionHeaderProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
}

export function SectionHeader({ title, viewAllHref, viewAllLabel }: SectionHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-xs md:text-sm font-semibold text-primary hover:underline transition-colors"
        >
          {viewAllLabel || t("discover.viewAll")}
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      )}
    </div>
  )
}
