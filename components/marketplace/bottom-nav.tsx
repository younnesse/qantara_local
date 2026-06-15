"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Home, Search, Bell, User } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { user } = useAuth()

  const navItems = [
    { href: "/", icon: Home, label: t("nav.home") },
    { href: "/consumer/search", icon: Search, label: t("nav.search") },
  ]

  if (user) {
    navItems.push(
      { href: "/consumer/notifications", icon: Bell, label: t("nav.notifications") },
      { href: "/consumer/profile", icon: User, label: t("nav.profile") }
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
