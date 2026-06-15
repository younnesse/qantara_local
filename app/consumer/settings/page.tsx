"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"
import { BottomNav } from "@/components/marketplace/bottom-nav"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Globe,
  Heart,
  Check
} from "lucide-react"
import { useState, useEffect } from "react"
import { AccountSettings } from "@/components/account/account-settings"

export default function ConsumerSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLanguage()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const themeLabel = !mounted ? "..." : theme === "dark" ? t("theme.dark") : theme === "light" ? t("theme.light") : t("theme.system")

  const settingsGroups = [
    {
      title: t("settings.account"),
      items: [
        { label: t("settings.editProfile"), icon: User, href: "/consumer/edit-profile" },
        { label: t("settings.savedProviders"), icon: Heart, href: "/consumer/favorites" },
        { label: t("settings.privacySecurity"), icon: Shield, href: "/consumer/privacy" },
      ],
    },
    {
      title: t("settings.support"),
      items: [
        { label: t("settings.helpCenter"), icon: HelpCircle, href: "/help" },
        { label: t("settings.termsOfService"), icon: FileText, href: "/terms" },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/consumer/profile"
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">{t("settings.title")}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                    index !== group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
                      <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <AccountSettings />

        {/* Preferences Section — Interactive */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            {t("settings.preferences")}
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowLangMenu(!showLangMenu); setShowThemeMenu(false) }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
                    <Globe className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">{t("settings.language")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t(`lang.${locale}`)}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showLangMenu ? "rotate-90" : ""}`} />
                </div>
              </button>

              {showLangMenu && (
                <div className="border-b border-border bg-muted/30">
                  {([
                    { code: "en" as const, label: "English", flag: "🇬🇧" },
                    { code: "fr" as const, label: "Français", flag: "🇫🇷" },
                    { code: "ar" as const, label: "العربية", flag: "🇸🇦" },
                  ]).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLocale(lang.code); setShowLangMenu(false) }}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className={`text-sm ${locale === lang.code ? "font-semibold text-primary" : "text-foreground"}`}>
                          {lang.label}
                        </span>
                      </div>
                      {locale === lang.code && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowThemeMenu(!showThemeMenu); setShowLangMenu(false) }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
                    <Moon className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">{t("settings.darkMode")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{themeLabel}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showThemeMenu ? "rotate-90" : ""}`} />
                </div>
              </button>

              {showThemeMenu && (
                <div className="border-t border-border bg-muted/30">
                  {([
                    { key: "system", label: t("theme.system"), icon: Monitor },
                    { key: "light", label: t("theme.light"), icon: Sun },
                    { key: "dark", label: t("theme.dark"), icon: Moon },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setTheme(opt.key); setShowThemeMenu(false) }}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon className="w-4 h-4 text-muted-foreground" />
                        <span className={`text-sm ${theme === opt.key ? "font-semibold text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                      </div>
                      {theme === opt.key && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("settings.logOut")}
          </Button>

          {/* Delete Account Button */}
          <Button
            variant="ghost"
            className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={async () => {
              if (confirm("Are you sure you want to delete your account? You will be logged out and your account will be permanently deleted if you do not sign back in within 30 days.")) {
                try {
                  if (user?.id) {
                    await fetch("/api/account", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id, role: user.role }) 
                    });
                  }
                  // Immediately logout after firing
                  handleLogout();
                } catch (e) {
                  console.error(e)
                }
              }
            }}
          >
            Delete Account
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Qantara v2.0.0
        </p>
      </div>

      <BottomNav />
    </main>
  )
}
