"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/marketplace/bottom-nav"
import { GigCard } from "@/components/marketplace/gig-card"
import type { Provider } from "@/lib/constants"
import { useLanguage } from "@/contexts/language-context"
import { EmptyState } from "@/components/marketplace/empty-state"
import { ArrowLeft, Heart } from "lucide-react"

export default function FavoritesPage() {
  const [savedProviders, setSavedProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true)
      try {
        const res = await fetch("/api/provider/favorite")
        if (res.ok) {
          const data = await res.json()
          setSavedProviders(data)
        }
      } catch (err) {
        console.error("Failed to fetch favorites:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

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
            <h1 className="text-xl font-bold text-foreground">{t("favorites.title")}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedProviders.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("favorites.noSaved")}
            description={t("favorites.noSavedHint")}
            actionLabel={t("favorites.browse")}
            actionHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {savedProviders.map((provider) => (
              <GigCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
