"use client"

import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  title: string
  className?: string
}

export function SkeletonCard({ title, className }: SkeletonCardProps) {
  return (
    <div className={cn("p-4 bg-card rounded-2xl border border-border", className)}>
      <h3 className="font-semibold text-card-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
