"use client"

import { Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ReviewBreakdownProps {
  reviews: { rating: number }[]
  averageRating: number
  totalReviews: number
}

export function ReviewBreakdown({ reviews, averageRating, totalReviews }: ReviewBreakdownProps) {
  const { formatNumber } = useLanguage()

  // Count reviews per star level
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { star, count, percentage }
  })

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Rating snapshot */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <span className="text-5xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
        <div className="flex items-center gap-0.5 my-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-4 h-4 ${
                s <= Math.round(averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {formatNumber(totalReviews)} reviews
        </span>
      </div>

      {/* Bar distribution */}
      <div className="flex-1 space-y-2">
        {distribution.map(({ star, count, percentage }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-4 text-right">{star}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{formatNumber(count)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
