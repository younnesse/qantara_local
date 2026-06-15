"use client"

import { cn } from "@/lib/utils"
import { Heart, GraduationCap, Scale, Palette, Stethoscope, Languages, LucideIcon, Cpu, Terminal, Code } from "lucide-react"

interface CategoryCardProps {
  name: string
  icon: string
  onClick?: () => void
  isActive?: boolean
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  Heart,
  GraduationCap,
  Scale,
  Palette,
  Stethoscope,
  Languages,
  Cpu,
  Terminal,
  Code,
}

export function CategoryCard({ name, icon, onClick, isActive, className }: CategoryCardProps) {
  const Icon = iconMap[icon] || Heart

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 min-w-[100px]",
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-card-foreground border-border hover:border-primary/30 hover:bg-primary/5",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isActive ? "bg-primary-foreground/20" : "bg-primary/10"
        )}
      >
        <Icon className={cn("w-6 h-6", isActive ? "text-primary-foreground" : "text-primary")} />
      </div>
      <span className="text-xs font-medium text-center whitespace-nowrap">{name}</span>
    </button>
  )
}
