"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface HeroSearchProps {
  onSearch: (query: string) => void
  initialValue?: string
}

export function HeroSearch({ onSearch, initialValue = "" }: HeroSearchProps) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleTagClick = (tag: string) => {
    setQuery(tag)
    onSearch(tag)
  }

  const popularTags = locale === "ar"
    ? ["طبيب", "كهربائي", "سباك", "مطور ويب", "طباخ / traiteur", "محامي"]
    : locale === "fr"
    ? ["Médecin", "Électricien", "Plombier", "Développeur Web", "Traiteur", "Avocat"]
    : ["Doctor", "Electrician", "Plumber", "Web Developer", "Catering", "Lawyer"]

  return (
    <section className="py-20 lg:py-28 px-4 bg-background">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-normal">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Giant Search Form */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto shadow-xl rounded-lg bg-card border border-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground rtl:left-auto rtl:right-4" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-32 rtl:pl-32 rtl:pr-12 text-base rounded-lg border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            placeholder={t("hero.searchPlaceholder")}
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 font-semibold rtl:right-auto rtl:left-2"
          >
            {t("nav.search") || "Rechercher"}
          </Button>
        </form>

        {/* Popular Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          <span className="text-sm text-muted-foreground">{t("hero.popular")}</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="text-sm px-3.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
