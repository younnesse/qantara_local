"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import {
  Search,
  Home,
  User,
  Settings,
  Heart,
  Bell,
  LogIn,
  UserPlus,
  HelpCircle,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react"
import { trackCommandPalette } from "@/lib/analytics"

interface PaletteItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  section: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t } = useLanguage()

  // All navigable pages
  const pages: PaletteItem[] = [
    { id: "home", label: t("nav.home"), icon: <Home className="w-4 h-4" />, href: "/", section: "Pages" },
    { id: "search", label: t("nav.search"), icon: <Search className="w-4 h-4" />, href: "/consumer/search", section: "Pages" },
    { id: "favorites", label: t("favorites.title") || "Favorites", icon: <Heart className="w-4 h-4" />, href: "/consumer/favorites", section: "Pages" },
    { id: "notifications", label: t("nav.notifications"), icon: <Bell className="w-4 h-4" />, href: "/consumer/notifications", section: "Pages" },
    { id: "profile", label: t("nav.profile"), icon: <User className="w-4 h-4" />, href: "/consumer/profile", section: "Pages" },
    { id: "settings", label: t("settings.title") || "Settings", icon: <Settings className="w-4 h-4" />, href: "/consumer/settings", section: "Pages" },
    { id: "login", label: t("home.logIn") || "Log In", icon: <LogIn className="w-4 h-4" />, href: "/login", section: "Auth" },
    { id: "signup", label: t("home.signUp") || "Sign Up", icon: <UserPlus className="w-4 h-4" />, href: "/signup", section: "Auth" },
    { id: "help", label: t("settings.help") || "Help", icon: <HelpCircle className="w-4 h-4" />, href: "/help", section: "Pages" },
  ]

  // Filter by query
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const filtered = query
    ? pages.filter((p) => normalize(p.label).includes(normalize(query)))
    : pages

  // Group by section
  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  const flatList = filtered

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
      trackCommandPalette()
    }
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    activeEl?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, flatList.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (flatList[activeIndex]) {
          navigate(flatList[activeIndex].href)
        }
      }
    },
    [flatList, activeIndex, navigate]
  )

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg mx-auto px-4"
          >
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, actions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-14 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-mono font-semibold text-muted-foreground bg-muted rounded-md border border-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
                {flatList.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No results found</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([section, items]) => (
                    <div key={section}>
                      <div className="px-4 py-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {section}
                        </span>
                      </div>
                      {items.map((item) => {
                        const globalIndex = flatList.findIndex((f) => f.id === item.id)
                        const isActive = globalIndex === activeIndex
                        return (
                          <button
                            key={item.id}
                            data-index={globalIndex}
                            onClick={() => navigate(item.href)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left rtl:text-right transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                              {item.icon}
                            </span>
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {isActive && (
                              <ArrowRight className="w-4 h-4 text-primary rtl-flip" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" /> select
                  </span>
                  <span className="flex items-center gap-1">
                    ↑↓ navigate
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
