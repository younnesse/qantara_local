"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Shield, Wrench, Briefcase, LayoutGrid } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
}

interface CategoryPillsProps {
  categories: Category[]
  activeCategory: string | null
  onCategorySelect: (id: string | null) => void
}

// Map icon string to Lucide component
const iconMap: Record<string, any> = {
  Shield: Shield,
  Wrench: Wrench,
  Briefcase: Briefcase,
}

export function CategoryPills({
  categories,
  activeCategory,
  onCategorySelect,
}: CategoryPillsProps) {
  const { t } = useLanguage()

  return (
    <div className="relative border-y bg-card border-border/60">
      <div className="max-w-7xl mx-auto flex items-center justify-start lg:justify-center overflow-x-auto py-3 px-4 gap-2 scrollbar-hide">
        {/* "All" button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border",
            activeCategory === null
              ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
              : "text-muted-foreground bg-transparent border-transparent hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          {t("discover.all")}
        </button>

        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Briefcase
          const isActive = activeCategory === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(isActive ? null : cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border",
                isActive
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "text-muted-foreground bg-transparent border-transparent hover:bg-muted hover:text-foreground"
              )}
            >
              <IconComponent className="w-4 h-4" />
              {t(cat.id)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
