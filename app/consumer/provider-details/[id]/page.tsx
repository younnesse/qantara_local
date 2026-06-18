"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { ReviewBreakdown } from "@/components/marketplace/review-breakdown"
import { ReviewCard } from "@/components/marketplace/review-card"
import { ServiceCard } from "@/components/marketplace/service-card"
import { FloatingCta } from "@/components/marketplace/floating-cta"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  Star,
  Send,
  Phone,
  Lock,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { trackProviderView, trackReviewSubmit } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { VerificationBadge } from "@/components/marketplace/verification-badge"

type TabId = "services" | "about" | "reviews"

export default function ProviderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    async function checkIsLiked() {
      if (user && user.role === "consumer") {
        try {
          const res = await fetch(`/api/provider/favorite?providerId=${params.id}`)
          if (res.ok) {
            const data = await res.json()
            setIsLiked(data.isLiked)
          }
        } catch (err) {
          console.error("Failed to check if provider is liked:", err)
        }
      }
    }
    checkIsLiked()
  }, [params.id, user])

  const handleLikeToggle = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    if (user.role !== "consumer") {
      return
    }
    
    const previousState = isLiked
    setIsLiked(!isLiked)
    
    try {
      const res = await fetch("/api/provider/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: params.id }),
      })
      if (!res.ok) {
        setIsLiked(previousState)
      } else {
        const data = await res.json()
        setIsLiked(data.isLiked)
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err)
      setIsLiked(previousState)
    }
  }

  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [selectedReviewServiceId, setSelectedReviewServiceId] = useState<string>("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [activeTab, setActiveTab] = useState<TabId>("services")
  const { t, formatNumber, locale } = useLanguage()

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true)
      try {
        const res = await fetch(`/api/providers/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProvider(data)
          trackProviderView(data.id, data.name)
          if (data.services?.length > 0 && !selectedReviewServiceId) {
            setSelectedReviewServiceId(data.services[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch provider:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProvider()
  }, [params.id, selectedReviewServiceId])

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?providerId=${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
      }
    }
    if (params.id) fetchReviews()
  }, [params.id])

  // Update URL hash on tab change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${activeTab}`)
    }
  }, [activeTab])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("provider.loading")}</div>
      </main>
    )
  }

  if (!provider) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {t("provider.notFound")}
          </h1>
          <Link href="/" className="text-primary hover:underline">
            {t("provider.backToDiscover")}
          </Link>
        </div>
      </main>
    )
  }

  const prices = provider.services?.map((s: any) => s.price).filter((p: any) => p !== null && p !== undefined) as number[]
  const minPrice = prices && prices.length > 0 ? Math.min(...prices) : null

  const tabs: { id: TabId; label: string }[] = [
    { id: "services", label: t("provider.servicesOffered") || "Services" },
    { id: "about", label: t("provider.about") },
    { id: "reviews", label: `${t("provider.reviews")} \u200E(${formatNumber(provider.reviewCount)})\u200E` },
  ]

  // Localized values for contact details card
  const locationVal = provider.location || (locale === "ar" ? "الجزائر" : locale === "fr" ? "Alger" : "Algiers")
  const memberSinceVal = locale === "ar" ? "٢٠٢٦" : "2026"
  const languagesVal = locale === "ar" ? "العربية، الفرنسية" : locale === "fr" ? "Arabe, Français" : "Arabic, French"
  const responseTimeVal = locale === "ar" ? "أقل من ساعتين" : locale === "fr" ? "Moins de 2h" : "Less than 2h"

  return (
    <main className="min-h-screen bg-background pb-28 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">
            {t("nav.home")}
          </Link>
          <span>/</span>
          {provider.category && (
            <>
              <Link href={`/consumer/search?category=${provider.category}`} className="hover:text-primary transition-colors capitalize">
                {t(provider.category) || provider.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {provider.name}
          </span>
        </nav>

        {/* Cover Banner & Profile Header */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm mb-8">
          {/* Blurred profile image as cover banner */}
          <div className="relative h-48 md:h-64 w-full bg-muted overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/10 z-10" />
            <img
              src={provider.image || "/placeholder-provider.jpg"}
              alt=""
              className="w-full h-full object-cover blur-md opacity-40 scale-110"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent z-10" />
          </div>

          {/* Profile details overlapping */}
          <div className="relative px-6 pb-6 -mt-16 md:-mt-20 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left rtl:md:text-right z-20">
            <Avatar className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-background shadow-xl ring-1 ring-border shrink-0 bg-card">
              <AvatarImage src={provider.image} alt={provider.name} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold">
                {provider.name?.[0]?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{provider.name}</h1>
                  <VerificationBadge provider={provider} />
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1.5 justify-center" dir="ltr">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-sm text-foreground">{provider.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatNumber(provider.reviewCount)} {t("discover.reviews")})
                  </span>
                </div>
              </div>

              <p className="text-base md:text-lg text-muted-foreground font-medium">{provider.title}</p>
              
              {/* Responsive indicator/tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1.5">
                <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-full">
                  {t(provider.category) || provider.category}
                </span>
                <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-full">
                  {t("provider.responseTime") || "Responds in <2h"}
                </span>
              </div>
            </div>
            
            {/* Save Button for Desktop */}
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleLikeToggle}
                className="h-11 w-11 rounded-lg border-border hover:bg-muted"
                aria-label="Save provider"
              >
                <Heart className={cn("w-5 h-5 transition-colors", isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Two-column layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Tabs, Services, About, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative cursor-pointer text-center ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                {/* Services Tab */}
                {activeTab === "services" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground mb-2">
                      {t("provider.servicesOffered") || "Services Offered"}
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {provider.services?.map((service: any, index: number) => (
                        <ServiceCard
                          key={index}
                          name={service.name}
                          price={service.price}
                          duration={`${service.duration} min`}
                        />
                      ))}
                      {(!provider.services || provider.services.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {t("provider.noServices")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* About Tab */}
                {activeTab === "about" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">
                      {t("provider.about") || "About the Seller"}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
                      {provider.bio || "No description provided."}
                    </p>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-foreground">
                      {t("provider.reviews") || "Client Reviews"}
                    </h2>
                    
                    {/* Review Breakdown */}
                    {reviews.length > 0 && (
                      <div className="bg-card rounded-xl border border-border p-5">
                        <ReviewBreakdown
                          reviews={reviews}
                          averageRating={provider.rating}
                          totalReviews={provider.reviewCount}
                        />
                      </div>
                    )}

                    {/* Submit Review Form */}
                    {user ? (
                      <div className="p-5 bg-muted/30 rounded-xl border border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">{t("provider.leaveReview")}</h3>

                        {provider.services?.length > 0 ? (
                          <div className="space-y-4">
                            <select
                              value={selectedReviewServiceId}
                              onChange={(e) => setSelectedReviewServiceId(e.target.value)}
                              className="w-full border border-input rounded-lg p-3 bg-background text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                              <option value="" disabled>{t("provider.selectServiceToReview")}</option>
                              {provider.services.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= (hoverRating || reviewRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground/30"
                                    } transition-colors`}
                                  />
                                </button>
                              ))}
                              {reviewRating > 0 && (
                                <span className="text-xs font-semibold text-muted-foreground ml-2">
                                  {reviewRating}/5
                                </span>
                              )}
                            </div>
                            
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder={t("provider.shareExperience")}
                              className="w-full border border-input rounded-lg p-3 bg-background resize-none h-24 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                            
                            <Button
                              size="sm"
                              className="gap-2 font-semibold"
                              disabled={reviewRating === 0 || !reviewComment.trim() || submittingReview || !selectedReviewServiceId}
                              onClick={async () => {
                                setSubmittingReview(true)
                                try {
                                  const res = await fetch("/api/reviews", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      clientId: user.id,
                                      serviceId: selectedReviewServiceId,
                                      rating: reviewRating,
                                      comment: reviewComment.trim(),
                                    }),
                                  })
                                  if (res.ok) {
                                    const newReview = await res.json()
                                    setReviews((prev) => [newReview, ...prev])
                                    setReviewRating(0)
                                    setReviewComment("")
                                    const provRes = await fetch(`/api/providers/${params.id}`)
                                    if (provRes.ok) setProvider(await provRes.json())
                                    trackReviewSubmit(params.id as string, reviewRating)
                                  }
                                } catch (err) {
                                  console.error("Failed to submit review:", err)
                                } finally {
                                  setSubmittingReview(false)
                                }
                              }}
                            >
                              <Send className="w-3.5 h-3.5" />
                              {submittingReview ? t("provider.submitting") : t("provider.submitReview")}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("provider.noServicesToReview")}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 bg-muted/40 rounded-xl border border-border">
                        {t("provider.logInToReview")}
                      </p>
                    )}

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("provider.noReviews")}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Sticky Contact Card (Desktop Only) */}
          <div className="hidden md:block lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              {/* Starting Price Header */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("provider.from") || "Starting At"}
                </span>
                <div className="flex items-baseline gap-1" dir="ltr">
                  {minPrice !== null ? (
                    <>
                      <span className="text-3xl font-extrabold text-foreground">
                        {formatNumber(minPrice)}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">DZD</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              {/* Seller details table */}
              <div className="border-t border-border pt-4 space-y-3.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("provider.location") || "Location"}</span>
                  <span className="font-semibold text-foreground">{locationVal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("provider.responseTime") || "Response Time"}</span>
                  <span className="font-semibold text-foreground">{responseTimeVal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("provider.memberSince") || "Member Since"}</span>
                  <span className="font-semibold text-foreground">{memberSinceVal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("provider.languages") || "Languages"}</span>
                  <span className="font-semibold text-foreground">{languagesVal}</span>
                </div>
              </div>

              {/* Desktop CTA actions */}
              <div className="space-y-3 pt-2">
                {user ? (
                  <>
                    {provider.phoneNumber && (
                      <a href={`tel:${provider.phoneNumber}`} className="block w-full">
                        <Button variant="outline" className="w-full rounded-md gap-2 h-12 font-semibold">
                          <Phone className="w-4 h-4" />
                          {t("provider.contact") || "Call Seller"}
                        </Button>
                      </a>
                    )}
                    <Button variant="default" className="w-full rounded-md gap-2 h-12 font-semibold">
                      <MessageCircle className="w-4 h-4" />
                      {t("provider.getQuote") || "Send Message"}
                    </Button>
                  </>
                ) : (
                  <Link href="/login" className="block w-full">
                    <Button variant="default" className="w-full rounded-md gap-2 h-12 font-semibold">
                      <Lock className="w-4 h-4" />
                      {t("provider.contactDetails") || "Login to Contact"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA for Mobile Only */}
      <FloatingCta provider={provider} user={user} minPrice={minPrice} />
    </main>
  )
}

