"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/marketplace/bottom-nav"
import { GigCard } from "@/components/marketplace/gig-card"
import { EmptyState } from "@/components/marketplace/empty-state"
import { StaggerContainer, StaggerItem } from "@/components/marketplace/animations"
import { Input } from "@/components/ui/input"
import { categories, ALGERIAN_WILAYAS } from "@/lib/constants"
import type { Provider } from "@/lib/constants"
import { useLanguage } from "@/contexts/language-context"
import { useDebounce } from "use-debounce"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ArrowLeft,
  X,
  Clock,
  TrendingUp,
  Loader2,
  Star,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"
import { trackSearch, trackCategorySelect } from "@/lib/analytics"

const RECENT_SEARCHES_KEY = "qantara_recent_searches"
const MAX_RECENT = 5

const getPopularSearches = (locale: string) => {
  if (locale === "ar") {
    return [
      "طبيب",
      "كهربائي",
      "سباك",
      "مطور ويب",
      "طباخ / traiteur",
      "محامي"
    ]
  } else if (locale === "fr") {
    return [
      "Médecin",
      "Électricien",
      "Plombier",
      "Développeur Web",
      "Traiteur",
      "Avocat"
    ]
  } else {
    return [
      "Doctor",
      "Electrician",
      "Plumber",
      "Web Developer",
      "Catering",
      "Lawyer"
    ]
  }
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return
  const existing = getRecentSearches().filter((s) => s !== query)
  const updated = [query, ...existing].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

function matchesCategoryQuery(category: string, query: string) {
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  
  const q = normalize(query)
  if (!q) return false
  if (!category) return false
  const catLower = category.toLowerCase()
  
  // Direct match on category ID
  if (normalize(catLower).includes(q)) return true
  
  // Localized matching mapping
  const mapping: Record<string, string[]> = {
    doctors: ["doctors", "doctor", "medecin", "medecins", "اطباء", "أطباء", "طبيب"],
    programmer: ["programmer", "programmers", "tech", "programming", "programmation", "developer", "developpeur", "dev", "تقنية", "برمجة", "مطور"],
    translator: ["translator", "translators", "traducteur", "traducteurs", "مترجم", "ترجمة"]
  }
  
  const terms = mapping[catLower] || []
  return terms.some(term => normalize(term).includes(q) || q.includes(normalize(term)))
}

function SearchPageContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery] = useDebounce(searchQuery, 300)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [location, setLocation] = useState("")
  const [debouncedLocation] = useDebounce(location, 300)
  const [minPrice, setMinPrice] = useState("")
  const [debouncedMinPrice] = useDebounce(minPrice, 300)
  const [maxPrice, setMaxPrice] = useState("")
  const [debouncedMaxPrice] = useDebounce(maxPrice, 300)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"rating" | "price" | "reviews">("rating")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, formatNumber, locale } = useLanguage()

  const searchParams = useSearchParams()

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/categories/metadata")
        if (res.ok) {
          const data = await res.json()
          setMetadata(data)
        }
      } catch (err) {
        console.error("Failed to load category metadata:", err)
      }
    }
    fetchMetadata()
  }, [])

  // Reset subcategory when category changes
  useEffect(() => {
    setActiveSubCategory(null)
  }, [activeCategory])

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q")
    const category = searchParams.get("category")
    const sub = searchParams.get("subCategory")
    if (q) {
      setSearchQuery(q)
    }
    if (category) {
      setActiveCategory(category)
    }
    if (sub) {
      setActiveSubCategory(sub)
    }
  }, [searchParams])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        if (debouncedQuery) queryParams.set("search", debouncedQuery)
        if (activeCategory) queryParams.set("category", activeCategory)
        if (activeSubCategory) queryParams.set("subCategory", activeSubCategory)
        if (minRating) queryParams.set("minRating", minRating.toString())
        if (debouncedLocation) queryParams.set("location", debouncedLocation)
        if (debouncedMinPrice) queryParams.set("minPrice", debouncedMinPrice)
        if (debouncedMaxPrice) queryParams.set("maxPrice", debouncedMaxPrice)

        const res = await fetch(`/api/providers?${queryParams.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setProviders(data)
        }
      } catch (err) {
        console.error("Failed to fetch providers:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [debouncedQuery, activeCategory, activeSubCategory, minRating, debouncedLocation, debouncedMinPrice, debouncedMaxPrice])

  const filteredProviders = [...providers]
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "reviews") return b.reviewCount - a.reviewCount
      if (sortBy === "price")
        return (a.services[0]?.price || 0) - (b.services[0]?.price || 0)
      return 0
    })

  const handleSearchSelect = useCallback((query: string) => {
    setSearchQuery(query)
    saveRecentSearch(query)
    setRecentSearches(getRecentSearches())
    setShowSuggestions(false)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim())
      setRecentSearches(getRecentSearches())
      setShowSuggestions(false)
      trackSearch(searchQuery.trim(), filteredProviders.length)
    }
  }, [searchQuery, filteredProviders.length])

  const handleClearRecent = useCallback(() => {
    clearRecentSearches()
    setRecentSearches([])
  }, [])

  const removeFilter = useCallback((type: string) => {
    if (type === "category") {
      setActiveCategory(null)
      setActiveSubCategory(null)
    }
    if (type === "subCategory") setActiveSubCategory(null)
    if (type === "rating") setMinRating(null)
    if (type === "location") setLocation("")
    if (type === "price") {
      setMinPrice("")
      setMaxPrice("")
    }
  }, [])

  // Active filters as removable pills
  const activeFilters: { type: string; label: string }[] = []
  if (activeCategory) {
    activeFilters.push({
      type: "category",
      label: t(activeCategory),
    })
  }

  // Get active subcategory label
  const currentCategoryMetadata = metadata.find(m => m.id === activeCategory)
  let subCategoryOptions: { id: string; name: string }[] = []
  let subCategoryLabel = ""

  if (activeCategory === "regulated_profession" && currentCategoryMetadata) {
    subCategoryOptions = (currentCategoryMetadata.regulatoryBodies || []).map((rb: any) => ({
      id: rb.id,
      name: locale === "ar" ? rb.nameAr : locale === "fr" ? rb.nameFr : rb.nameEn
    }))
    subCategoryLabel = t("search.filterByOrder") || "Filter by Order"
  } else if (activeCategory === "artisan" && currentCategoryMetadata) {
    subCategoryOptions = (currentCategoryMetadata.trades || []).map((tr: any) => ({
      id: tr.id,
      name: locale === "ar" ? tr.nameAr : locale === "fr" ? tr.nameFr : tr.nameEn
    }))
    subCategoryLabel = t("search.filterByTrade") || "Filter by Trade"
  } else if (activeCategory === "auto_entrepreneur" && currentCategoryMetadata) {
    subCategoryOptions = (currentCategoryMetadata.autoEntrepreneurActivities || []).map((aea: any) => ({
      id: aea.id,
      name: locale === "ar" ? aea.nameAr : locale === "fr" ? aea.nameFr : aea.nameEn
    }))
    subCategoryLabel = t("search.filterByActivity") || "Filter by Activity"
  }

  if (activeSubCategory && activeCategory && currentCategoryMetadata) {
    const selectedOpt = subCategoryOptions.find(o => o.id === activeSubCategory)
    if (selectedOpt) {
      activeFilters.push({
        type: "subCategory",
        label: selectedOpt.name,
      })
    }
  }
  if (minRating) {
    activeFilters.push({
      type: "rating",
      label: `${minRating}+ ★`,
    })
  }
  if (location) {
    activeFilters.push({
      type: "location",
      label: location,
    })
  }
  if (minPrice || maxPrice) {
    activeFilters.push({
      type: "price",
      label: `${minPrice || 0} - ${maxPrice || "∞"} DZD`,
    })
  }

  // Debounce indicator
  const isSearching = searchQuery !== debouncedQuery

  // Trending providers (top 3 by rating)
  const trendingProviders = [...providers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">{t("search.title")}</h1>
          </div>

          {/* Search Input with suggestions */}
          <div ref={searchRef} className="relative space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                {isSearching && (
                  <Loader2 className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit()
                  }}
                  className="pl-10 rtl:pl-3 rtl:pr-10 h-12 rounded-xl bg-muted border-0"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                  showFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
                aria-label="Filter directory listings"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-semibold hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Collapsible filtration controls */}
            {showFilters && (
              <div className="p-4 bg-card border border-border rounded-2xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Wilaya Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("provider.location")} (Wilaya)
                    </label>
                    <Select
                      onValueChange={(val) => setLocation(val === "all" ? "" : val)}
                      value={location || "all"}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted border-0">
                        <SelectValue placeholder={t("search.locationPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("search.allWilayas") || "All Wilayas"}</SelectItem>
                        {ALGERIAN_WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("footer.categories") || "Category"}
                    </label>
                    <Select
                      onValueChange={(val) => {
                        setActiveCategory(val === "all" ? null : val)
                        setActiveSubCategory(null)
                      }}
                      value={activeCategory || "all"}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted border-0">
                        <SelectValue placeholder={t("search.selectCategory") || "Select Category"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("search.allCategories") || "All Categories"}</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {t(c.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activity Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {subCategoryLabel || "Activity"}
                    </label>
                    <Select
                      disabled={!activeCategory}
                      onValueChange={(val) => setActiveSubCategory(val === "all" ? null : val)}
                      value={activeSubCategory || "all"}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted border-0 disabled:opacity-50">
                        <SelectValue placeholder={activeCategory ? "Select Activity" : (t("search.chooseCategoryFirst") || "Choose a category first")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("search.allSubcategories") || "All Activities"}</SelectItem>
                        {subCategoryOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Price Range (DZD)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-10 rounded-xl bg-muted border-0 w-full"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">to</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-10 rounded-xl bg-muted border-0 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Rating:</span>
                    <div className="flex gap-1.5">
                      {[4, 4.5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setMinRating(minRating === r ? null : r)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                            minRating === r
                              ? "bg-amber-500 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                          {r}+
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLocation("")
                      setActiveCategory(null)
                      setActiveSubCategory(null)
                      setMinPrice("")
                      setMaxPrice("")
                      setMinRating(null)
                    }}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("search.recent") || "Recent"}
                      </span>
                      <button
                        onClick={handleClearRecent}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("search.clearAll") || "Clear"}
                      </button>
                    </div>
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearchSelect(s)}
                        className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left rtl:text-right"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground">{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                <div className="p-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    {t("search.popular") || "Popular"}
                  </span>
                  {getPopularSearches(locale).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchSelect(s)}
                      className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left rtl:text-right"
                    >
                      <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{s}</span>
                    </button>
                  ))}
                </div>

                {/* Trending Providers */}
                {trendingProviders.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                      {t("search.trending") || "Trending"}
                    </span>
                    {trendingProviders.map((p) => (
                      <Link
                        key={p.id}
                        href={`/consumer/provider-details/${p.id}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                          {p.image && (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="text-left rtl:text-right">
                          <span className="text-sm font-medium text-foreground block">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.title} · ⭐ {p.rating}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("discover.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(c.id)}
            </button>
          ))}

          {/* Rating filters */}
          <div className="w-px bg-border mx-1 shrink-0" />
          {[4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? null : r)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                minRating === r
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              {r}+
            </button>
          ))}
        </div>

        {/* Subcategory Filter Chips */}
        {activeCategory && subCategoryOptions.length > 0 && (
          <div className="flex flex-col gap-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {subCategoryLabel}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
              <button
                onClick={() => setActiveSubCategory(null)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeSubCategory === null
                    ? "bg-primary/20 text-primary border-primary/30 font-bold"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                }`}
              >
                {t("search.allSubcategories") || "All"}
              </button>
              {subCategoryOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveSubCategory(activeSubCategory === opt.id ? null : opt.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    activeSubCategory === opt.id
                      ? "bg-primary/20 text-primary border-primary/30 font-bold"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters as removable pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <span
                key={f.type}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {f.label}
                <button onClick={() => removeFilter(f.type)} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => { setActiveCategory(null); setMinRating(null); setActiveSubCategory(null); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("search.clearAll") || "Clear all"}
            </button>
          </div>
        )}

        {/* Results Header: Count + Sort + View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading
              ? t("search.loading")
              : `${formatNumber(filteredProviders.length)} ${filteredProviders.length !== 1 ? t("search.providersFound") : t("search.providerFound")}`}
          </p>
          <div className="flex items-center gap-2">
            {/* Sort pills */}
            <div className="flex gap-1">
              {(
                [
                  { key: "rating", label: t("search.rating") },
                  { key: "reviews", label: t("search.reviewsSort") },
                  { key: "price", label: t("search.price") },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    sortBy === option.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex bg-muted rounded-lg p-0.5 ml-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProviders.length > 0 ? (
          <StaggerContainer className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-4"}>
            {filteredProviders.map((provider) => (
              <StaggerItem key={provider.id}>
                <GigCard provider={provider} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <EmptyState
            icon={Search}
            title={t("search.noResults")}
            description={t("search.noResultsHint")}
            suggestions={["Médecin Alger", "Développeur web", "Traducteur Oran", "Dermatologue"]}
            onSuggestionClick={(s) => setSearchQuery(s)}
          />
        )}
      </div>

      <BottomNav />
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
