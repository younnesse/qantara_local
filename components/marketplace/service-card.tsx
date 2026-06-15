"use client"

import { cn } from "@/lib/utils"
import { Clock, DollarSign } from "lucide-react"

interface ServiceCardProps {
  name: string
  price: number
  duration: string
  onSelect?: () => void
  isSelected?: boolean
  className?: string
}

export function ServiceCard({
  name,
  price,
  duration,
  onSelect,
  isSelected,
  className,
}: ServiceCardProps) {
  const Component = onSelect ? "button" : "div"
  
  return (
    <Component
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card",
        onSelect && !isSelected && "hover:border-primary/30 cursor-pointer",
        className
      )}
    >
      <div className="flex-1">
        <h4 className="font-medium text-card-foreground">{name}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-lg font-semibold text-primary" dir="ltr">
        {price} DA
      </div>
    </Component>
  )
}

