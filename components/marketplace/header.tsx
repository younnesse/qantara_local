"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppLogo } from "@/components/marketplace/app-logo"
import { LanguageSwitcher } from "@/components/marketplace/language-switcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { useScrollPosition } from "@/hooks/use-scroll-position"
import { Search, Bell, Menu, X, LogOut, User, Download } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePWA } from "@/contexts/pwa-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA()
  const scrollPosition = useScrollPosition()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState("")

  const isHomepage = pathname === "/"
  // Show header search if we are not on homepage, OR if we scrolled down past 200px
  const showSearch = !isHomepage || scrollPosition > 220

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/consumer/search?search=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center">
          <AppLogo size="sm" />
        </div>

        {/* Center: Scroll-Aware Search Bar */}
        <div
          className={cn(
            "flex-1 max-w-xl mx-4 md:mx-8 transition-all duration-300 transform",
            showSearch
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none hidden md:block"
          )}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              type="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-24 rtl:pl-24 rtl:pr-9 rounded-md bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm"
              placeholder={t("discover.searchPlaceholder")}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs rtl:right-auto rtl:left-1"
            >
              {t("nav.search") || "Search"}
            </Button>
          </form>
        </div>

        {/* Right: Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">


          {isInstallable && !isInstalled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={installApp}
              className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
            >
              <Download className="w-4 h-4" />
              {t("nav.installApp") || "Install App"}
            </Button>
          )}

          {isIOS && !isInstalled && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 font-semibold text-primary"
                >
                  <Download className="w-4 h-4" />
                  {t("nav.installApp") || "Install App"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 text-xs text-muted-foreground bg-popover border-border">
                {t("nav.installHintiOS")}
              </PopoverContent>
            </Popover>
          )}

          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "consumer" && (
                <Link
                  href="/consumer/notifications"
                  className="p-2 rounded-full hover:bg-muted transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                </Link>
              )}
              <Link href={`/${user.role}/profile`}>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {t("nav.profile")}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold">
                  {t("home.logIn")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="font-semibold">
                  {t("home.signUp")}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger (Mobile) */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-4 animate-in slide-in-from-top duration-200">


          {isInstallable && !isInstalled && (
            <Button
              variant="outline"
              onClick={() => {
                installApp()
                setMobileMenuOpen(false)
              }}
              className="w-full font-semibold text-primary flex items-center justify-center gap-1.5"
            >
              <Download className="w-5 h-5" />
              {t("nav.installApp") || "Install App"}
            </Button>
          )}

          {isIOS && !isInstalled && (
            <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
              {t("nav.installHintiOS")}
            </div>
          )}

          {user ? (
            <div className="space-y-2">
              <Link href={`/${user.role}/profile`} onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="w-5 h-5" />
                  {t("nav.profile")}
                </Button>
              </Link>
              {user.role === "consumer" && (
                <Link href="/consumer/notifications" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Bell className="w-5 h-5" />
                    {t("nav.notifications")}
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
                {t("settings.logOut")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button variant="ghost" className="w-full font-semibold">
                  {t("home.logIn")}
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button className="w-full font-semibold">
                  {t("home.signUp")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
