"use client"

import { useState } from "react"
import { BottomNav } from "@/components/marketplace/bottom-nav"
import { GigCard } from "@/components/marketplace/gig-card"
import { EmptyState } from "@/components/marketplace/empty-state"
import { StaggerContainer, StaggerItem } from "@/components/marketplace/animations"
import { categories } from "@/lib/constants"
import type { Provider } from "@/lib/constants"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Search, Star, ShieldCheck, Trophy, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HeroWithVideo } from "@/components/marketplace/hero-video"
import { TrustBar } from "@/components/marketplace/trust-bar"
import { CategoryPills } from "@/components/marketplace/category-pills"
import { SectionHeader } from "@/components/marketplace/section-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"

interface HomePageClientProps {
  initialProviders: Provider[]
  topRatedProviders: Provider[]
}

export function HomePageClient({ initialProviders, topRatedProviders }: HomePageClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { t, formatNumber, locale } = useLanguage()
  const { user } = useAuth()

  // Strip accents for accent-insensitive search (é→e, ê→e, ï→i, etc.)
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  const matchesCategoryQuery = (category: string, query: string) => {
    const q = normalize(query)
    if (!q) return false
    if (!category) return false
    const catLower = category.toLowerCase()
    
    if (normalize(catLower).includes(q)) return true
    
    const mapping: Record<string, string[]> = {
      doctors: ["doctors", "doctor", "medecin", "medecins", "اطباء", "أطباء", "طبيب"],
      programmer: ["programmer", "programmers", "tech", "programming", "programmation", "developer", "developpeur", "dev", "تقنية", "برمجة", "مطور"],
      translator: ["translator", "translators", "traducteur", "traducteurs", "مترجم", "ترجمة"]
    }
    
    const terms = mapping[catLower] || []
    return terms.some(term => normalize(term).includes(q) || q.includes(normalize(term)))
  }

  const filteredProviders = initialProviders.filter((provider) => {
    const q = normalize(searchQuery)
    const matchesSearch =
      normalize(provider.name || "").includes(q) ||
      normalize(provider.title || "").includes(q) ||
      normalize(provider.bio || "").includes(q) ||
      matchesCategoryQuery(provider.category || "", searchQuery)
    const matchesCategory = activeCategory
      ? provider.category?.includes(activeCategory) ?? false
      : true
    return matchesSearch && matchesCategory
  })

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <HeroWithVideo
        onSearch={(query) => router.push(`/consumer/search?search=${encodeURIComponent(query)}`)}
        popularSearches={
          locale === "ar"
            ? ["طبيب", "كهربائي", "سباك", "مطور ويب", "طباخ / traiteur", "محامي"]
            : locale === "fr"
            ? ["Médecin", "Électricien", "Plombier", "Développeur Web", "Traiteur", "Avocat"]
            : ["Doctor", "Electrician", "Plumber", "Web Developer", "Catering", "Lawyer"]
        }
      />

      {/* Trust Signals Bar */}
      <TrustBar />

      {/* Categories Navigation Pills */}
      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Featured Providers Section */}
        <section>
          <SectionHeader
            title={
              activeCategory
                ? t(activeCategory)
                : t("discover.featuredProviders")
            }
            viewAllHref="/consumer/search"
            viewAllLabel={t("discover.viewAll")}
          />

          {filteredProviders.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProviders.map((provider) => (
                <StaggerItem key={provider.id}>
                  <GigCard provider={provider} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={Search}
              title={t("discover.noProviders")}
              description={t("discover.noProvidersHint")}
              suggestions={["Généraliste", "Développeur web", "Traducteur", "Dermatologue"]}
              onSuggestionClick={(s) => setSearchQuery(s)}
            />
          )}
        </section>

        {/* Premium Top Rated Section with Animations */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  {t("discover.topRated") || "Top-Rated Providers"}
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Handpicked experts with outstanding service standards</p>
              </div>
            </div>
            <Link
              href="/consumer/search?sort=rating"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("discover.seeMore") || "See more"}
            </Link>
          </div>
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" delay={0.15}>
            {topRatedProviders.slice(0, 3).map((provider, index) => (
              <StaggerItem key={provider.id}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative flex flex-col justify-between h-full p-5 bg-background border border-border rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/45 overflow-hidden"
                >
                  {/* Rank Badge Overlay */}
                  <div className="absolute top-0 right-0 flex items-center justify-center w-12 h-12 bg-gradient-to-bl from-amber-500 to-yellow-400 text-white font-black text-sm rounded-bl-2xl shadow-sm z-10">
                    #{index + 1}
                  </div>
                  
                  <div>
                    {/* Header Info */}
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14 rounded-xl border border-border/80 shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={provider.image} alt={provider.name} className="object-cover" />
                        <AvatarFallback className="text-sm font-bold bg-muted text-muted-foreground">
                          {provider.name?.[0]?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 pr-8">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {provider.name}
                          </h3>
                          {provider.verified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <span className="inline-block text-[10px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md mt-1 capitalize">
                          {provider.category ? t(provider.category) || provider.category : ""}
                        </span>
                      </div>
                    </div>
                    
                    {/* Title and Bio snippet */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {provider.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {provider.bio}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Rating Footer */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{provider.rating.toFixed(1)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        ({formatNumber(provider.reviewCount)} reviews)
                      </span>
                    </div>
                    
                    <Link href={`/consumer/provider-details/${provider.id}`}>
                      <button className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-all duration-300">
                        View Profile
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>

      {user?.role === 'consumer' && <BottomNav />}
    </main>
  )
}
