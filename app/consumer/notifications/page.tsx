"use client"

import { BottomNav } from "@/components/marketplace/bottom-nav"
import { EmptyState } from "@/components/marketplace/empty-state"
import { ArrowLeft, Bell } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export default function NotificationsPage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
              </Link>
              <h1 className="text-lg font-semibold text-foreground">
                {t("notifications.title")}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <EmptyState
          icon={Bell}
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDesc")}
          actionLabel={t("notifications.browse")}
          actionHref="/"
        />
      </div>

      <BottomNav />
    </main>
  )
}
