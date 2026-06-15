"use client"

import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

type AlertVariant = "info" | "warning" | "success" | "error"

interface AlertBannerProps {
  variant?: AlertVariant
  title?: string
  message: string
  className?: string
}

const variantStyles: Record<AlertVariant, { bg: string; icon: typeof AlertCircle; iconColor: string }> = {
  info: {
    bg: "bg-primary/10 border-primary/20",
    icon: Info,
    iconColor: "text-primary",
  },
  warning: {
    bg: "bg-accent/30 border-accent/50",
    icon: AlertCircle,
    iconColor: "text-accent-foreground",
  },
  success: {
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  error: {
    bg: "bg-destructive/10 border-destructive/20",
    icon: XCircle,
    iconColor: "text-destructive",
  },
}

export function AlertBanner({ variant = "info", title, message, className }: AlertBannerProps) {
  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div
      className={cn(
        "w-full px-4 py-3 rounded-xl border flex items-start gap-3",
        styles.bg,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", styles.iconColor)} />
      <div className="flex-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <p className="text-sm text-foreground/80">{message}</p>
      </div>
    </div>
  )
}
