"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  suggestions,
  onSuggestionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-2xl bg-muted/80 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick?.(s)}
              className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="default" className="rounded-xl px-6">
            {actionLabel}
          </Button>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <Button variant="default" className="rounded-xl px-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
