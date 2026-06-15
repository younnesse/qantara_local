"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface RoleCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  className?: string
}

export function RoleCard({ title, description, icon: Icon, href, className }: RoleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-5 p-6 bg-card rounded-2xl border border-border",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        "hover:border-primary/30 hover:bg-primary/5",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
