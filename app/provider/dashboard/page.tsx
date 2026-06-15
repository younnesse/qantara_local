"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Star,
  TrendingUp,
  Clock,
  ChevronRight,
  Bell,
  Settings,
  ArrowLeft
} from "lucide-react"

export default function ProviderDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month")

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/provider/profile"
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 rtl-flip" />
            </Link>
            <div className="flex gap-2">
              <Link href="/provider/notifications" className="p-2 rounded-xl hover:bg-white/10 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </Link>
              <Link href="/provider/settings" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">{t("dashboard.welcome")}</h1>
          <p className="text-primary-foreground/80">
            {t("dashboard.overview")}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4">

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Button asChild variant="outline" className="h-12">
            <Link href="/provider/services">
              <Settings className="w-4 h-4 mr-2" />
              {t("settings.manageServices")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

