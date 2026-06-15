"use client"

import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100
        return (
          <div key={index} className="relative">
            <Star className={cn(sizeMap[size], "text-muted")} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star className={cn(sizeMap[size], "fill-accent text-accent")} />
            </div>
          </div>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-foreground" dir="ltr">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
