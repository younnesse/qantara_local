"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/contexts/language-context"

interface HeroWithVideoProps {
  onSearch: (query: string) => void
  popularSearches: string[]
}

export function HeroWithVideo({ onSearch, popularSearches }: HeroWithVideoProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Respect prefers-reduced-motion for accessibility
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  // Programmatic autoplay and muting fallback
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.defaultMuted = true
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay was prevented by browser sandbox. Retrying on user interaction...", err)
        })
      }
    }
  }, [videoFailed, prefersReducedMotion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const showVideo = !videoFailed && !prefersReducedMotion

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden w-full bg-zinc-950">
      {/* Video Background */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Background video showing Algerian professionals at work"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        >
          <source
            src="/videos/hero-bg.mp4"
            type="video/mp4"
            onError={() => {
              console.error("Failed to load hero background video asset.")
              setVideoFailed(true)
            }}
          />
        </video>
      )}

      {/* Fallback Background Image/Gradient */}
      {(!showVideo || videoFailed) && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/placeholder.jpg')" }}
        />
      )}

      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content Container */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center space-y-8 py-16">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-normal">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Giant Search Form (Adaptive theme container) */}
        <form
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto shadow-2xl rounded-lg bg-background/95 dark:bg-zinc-900/95 border border-border/60 dark:border-zinc-800 backdrop-blur-md"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground rtl:left-auto rtl:right-4 z-30" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-32 rtl:pl-32 rtl:pr-12 text-base text-foreground placeholder:text-muted-foreground rounded-lg border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:ring-offset-transparent"
            placeholder={t("hero.searchPlaceholder")}
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 font-semibold rtl:right-auto rtl:left-2 cursor-pointer z-30 text-white dark:text-zinc-950"
          >
            {t("nav.search") || "Rechercher"}
          </Button>
        </form>

        {/* Popular Pills (Glassmorphism layout) */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          <span className="text-sm text-white/80 font-medium">{t("hero.popular")}</span>
          {popularSearches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag)
                onSearch(tag)
              }}
              className="text-sm px-4 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm font-medium cursor-pointer border border-white/10 hover:border-white/20 active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
