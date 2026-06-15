"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { StarRating } from "./star-rating"

interface Review {
  id: string;
  authorName: string;
  authorImage: string;
  rating: number;
  date: string;
  comment: string;
  serviceName?: string;
}

interface ReviewCardProps {
  review: Review
  className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <div className={cn("p-4 bg-card rounded-2xl border border-border", className)}>
      <div className="flex items-start gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
          <Image
            src={review.authorImage}
            alt={review.authorName}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-card-foreground">{review.authorName}</h4>
            <span className="text-xs text-muted-foreground" dir="ltr">{review.date}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            {review.serviceName && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {review.serviceName}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  )
}

