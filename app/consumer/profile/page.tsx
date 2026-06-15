"use client"

import { useAuth } from "@/contexts/auth-context"
import { BottomNav } from "@/components/marketplace/bottom-nav"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import {
  User,
  Settings,
  CreditCard,
  Heart,
  Calendar,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bell,
} from "lucide-react"
import Link from "next/link"

export default function ConsumerProfilePage() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const menuItems = [
    {
      icon: Heart,
      label: t("profile.menu.favorites"),
      href: "/consumer/favorites",
      description: t("profile.menu.favoritesDesc"),
    },
    {
      icon: CreditCard,
      label: t("profile.menu.payments"),
      href: "/consumer/payments",
      description: t("profile.menu.paymentsDesc"),
    },
    {
      icon: Bell,
      label: t("profile.menu.notifications"),
      href: "/consumer/notification-settings",
      description: t("profile.menu.notificationsDesc"),
    },
    {
      icon: HelpCircle,
      label: t("profile.menu.support"),
      href: "/consumer/support",
      description: t("profile.menu.supportDesc"),
    },
  ]

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-foreground">{t("profile.title")}</h1>
            <Link
              href="/consumer/settings"
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">
                {user?.username || t("profile.guest")}
              </h2>
              <p className="text-muted-foreground">
                {user?.email || t("profile.signInHint")}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              {t("profile.edit")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Menu Items */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t("profile.signOut")}
        </Button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground">
          Qantara v2.0.0
        </p>
      </div>

      <BottomNav />
    </main>
  )
}
