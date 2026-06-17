"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AppLogo } from "@/components/marketplace/app-logo"
import { AlertBanner } from "@/components/marketplace/alert-banner"
import { SkeletonCard, SkeletonList } from "@/components/marketplace/skeleton-card"
import { StarRating } from "@/components/marketplace/star-rating"
import { ReviewCard } from "@/components/marketplace/review-card"
import { ServiceCard } from "@/components/marketplace/service-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Provider, Review } from "@/lib/constants"
import { categories, ALGERIAN_WILAYAS } from "@/lib/constants"
import { WebcamCapture } from "@/components/marketplace/webcam-capture"
import { FileUpload } from "@/components/marketplace/file-upload"
import Image from "next/image"
import Link from "next/link"
import {
  BadgeCheck,
  Calendar,
  Clock,
  Edit,
  LogOut,
  Settings,
  User,
  AlertTriangle,
  Shield,
  Wrench,
  Briefcase,
  Plus,
  Trash,
  Upload,
  Loader2,
} from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VerificationBadge } from "@/components/marketplace/verification-badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export default function ProviderProfilePage() {
  const { user, updateProviderStatus, updateProfile, logout } = useAuth()
  const { t, locale } = useLanguage()
  const [isVerified, setIsVerified] = useState(user?.providerStatus === "verified")
  const [isProfileComplete, setIsProfileComplete] = useState(user?.isProfileComplete || false)
  
  // Separated Verification States
  const [isIdentityDialogOpen, setIsIdentityDialogOpen] = useState(false)
  const [identityMethod, setIdentityMethod] = useState<"yoti" | "manual">("yoti")
  const [manualIdFile, setManualIdFile] = useState<File | null>(null)
  const [manualIdPreview, setManualIdPreview] = useState<string | null>(null)
  const [manualSelfieFile, setManualSelfieFile] = useState<File | null>(null)
  const [manualSelfiePreview, setManualSelfiePreview] = useState<string | null>(null)
  const [identityLoading, setIdentityLoading] = useState(false)
  const [identityUploadResult, setIdentityUploadResult] = useState<any>(null)

  const [isProfessionalDialogOpen, setIsProfessionalDialogOpen] = useState(false)
  const [certificateId, setCertificateId] = useState("")
  const [customActivityName, setCustomActivityName] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPreview, setCertPreview] = useState<string | null>(null)
  const [professionalLoading, setProfessionalLoading] = useState(false)
  const [professionalUploadResult, setProfessionalUploadResult] = useState<any>(null)

  // Didit IDV states
  const [diditSessionId, setDiditSessionId] = useState("")
  const [diditSessionUrl, setDiditSessionUrl] = useState("")
  const [diditLoading, setDiditLoading] = useState(false)

  const startDiditSession = async () => {
    setDiditLoading(true)
    try {
      const res = await fetch("/api/provider/didit/create-session", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setDiditSessionId(data.sessionId)
        setDiditSessionUrl(data.sessionUrl)
      } else {
        alert("Failed to initialize Didit verification session. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Error starting Didit session.")
    } finally {
      setDiditLoading(false)
    }
  }

  // 3-Category verification states
  const [selectedCategory, setSelectedCategory] = useState<"regulated_profession" | "artisan" | "auto_entrepreneur" | null>(null)
  const [subCategoryId, setSubCategoryId] = useState("")
  const [secondaryActivities, setSecondaryActivities] = useState<string[]>([])
  const [metadataCategories, setMetadataCategories] = useState<any[]>([])

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/categories/metadata")
        if (res.ok) {
          const data = await res.json()
          setMetadataCategories(data)
        }
      } catch (err) {
        console.error("Failed to fetch categories metadata", err)
      }
    }
    fetchMetadata()
  }, [])

  const [dbProvider, setDbProvider] = useState<any>(null)
  const currentProfessionalStatus = 
    dbProvider?.category === "regulated_profession" ? dbProvider?.licenseStatus :
    dbProvider?.category === "artisan" ? dbProvider?.cnamCardStatus :
    dbProvider?.category === "auto_entrepreneur" ? dbProvider?.anaeCardStatus :
    "NOT_SUBMITTED"

  const currentProfessionalRejectionReason = 
    dbProvider?.category === "regulated_profession" ? dbProvider?.licenseRejectionReason :
    dbProvider?.category === "artisan" ? dbProvider?.cnamCardRejectionReason :
    dbProvider?.category === "auto_entrepreneur" ? dbProvider?.anaeCardRejectionReason :
    null

  const [providerReviews, setProviderReviews] = useState<Review[]>([])

  useEffect(() => {
    async function fetchMyProfile() {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/providers/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setDbProvider(data)
          setBio(data.bio || "")
          setProfilePhoto(data.image || "")
          setLocation(data.location || "")
          setServices(data.services || [])
          setSelectedCategories(data.category ? data.category.split(',') : [])
          if (data.certificateStatus === "VALID") {
            setIsVerified(true)
          }
        }
      } catch (err) {
        console.error("Failed to fetch provider profile:", err)
      }
    }
    fetchMyProfile()
  }, [user?.id])

  useEffect(() => {
    async function fetchReviews() {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/reviews?providerId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setProviderReviews(data)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
      }
    }
    fetchReviews()
  }, [user?.id])

  // Profile Form States
  const [wizardStep, setWizardStep] = useState(1);
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [profilePhoto, setProfilePhoto] = useState("")
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false)
  const [services, setServices] = useState<{name: string; price: any; duration: string}[]>([])

  const handleProfilePhotoSelect = async (file: File | null) => {
    if (!file) {
      setProfilePhoto("")
      return
    }

    setUploadingProfilePhoto(true)
    try {
      const formData = new FormData()
      formData.append("userId", user?.id || "")
      formData.append("file", file)

      const response = await fetch("/api/provider/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to upload image")
      }

      const data = await response.json()
      setProfilePhoto(data.url)
    } catch (error) {
      console.error("Profile photo upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload profile photo.")
    } finally {
      setUploadingProfilePhoto(false)
    }
  }

  const [portfolio, setPortfolio] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Dynamic Form Handlers
  const addService = () => setServices([...services, {name: "", price: "", duration: ""}])
  const removeService = (index: number) => setServices(services.filter((_, i) => i !== index))
  const updateService = (index: number, field: string, value: string) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const addPortfolioItem = () => setPortfolio([...portfolio, ""])
  const updatePortfolioItem = (index: number, value: string) => {
    const updated = [...portfolio]
    updated[index] = value
    setPortfolio(updated)
  }
  const removePortfolioItem = (index: number) => setPortfolio(portfolio.filter((_, i) => i !== index))

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleIdentitySubmit = async () => {
    if (!user?.id) {
      alert("Session expired or not loaded. Please log in again.");
      return;
    }

    setIdentityLoading(true);
    setIdentityUploadResult(null);

    const formData = new FormData();
    formData.append("userId", user.id);

    if (identityMethod === "yoti") {
      if (!diditSessionId) {
        alert("Please complete Didit verification first!");
        setIdentityLoading(false);
        return;
      }
      formData.append("diditSessionId", diditSessionId);
    } else {
      if (!manualIdFile || !manualSelfieFile) {
        alert("Please select both ID Card and Selfie files!");
        setIdentityLoading(false);
        return;
      }
      formData.append("idCard", manualIdFile);
      try {
        const base64Selfie = await fileToBase64(manualSelfieFile);
        formData.append("selfie", base64Selfie);
      } catch (err) {
        console.error("Error converting selfie to base64", err);
        alert("Failed to process selfie image.");
        setIdentityLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/provider/verify-identity", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Server failed to process the identity verification.");
      }

      setIdentityUploadResult(data);

      setTimeout(() => {
        setIsIdentityDialogOpen(false);
        window.location.reload();
      }, 4000);
    } catch (error) {
      console.error("Error verifying identity:", error);
      alert(error instanceof Error ? error.message : "Encountered an error verifying identity.");
    } finally {
      setIdentityLoading(false);
    }
  };

  const handleProfessionalSubmit = async () => {
    if (!certFile || !selectedCategory || !subCategoryId) {
      alert("Please enter all required professional fields!");
      return;
    }

    setProfessionalLoading(true);
    setProfessionalUploadResult(null);

    const formData = new FormData();
    formData.append("certificate", certFile);
    formData.append("certificateId", certificateId);
    formData.append("professionalCategoryId", selectedCategory);
    formData.append("subCategoryId", subCategoryId);
    if (subCategoryId === "other") {
      formData.append("customActivityName", customActivityName);
    }
    if (!user?.id) {
      alert("Session expired or not loaded. Please log in again.");
      setProfessionalLoading(false);
      return;
    }
    formData.append("userId", user.id);

    try {
      const response = await fetch("/api/provider/verify-professional", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Server failed to process professional credentials.");
      }

      setProfessionalUploadResult(data);

      setTimeout(() => {
        setIsProfessionalDialogOpen(false);
        window.location.reload();
      }, 6000);
    } catch (error) {
      console.error("Error verifying credentials:", error);
      alert(error instanceof Error ? error.message : "Encountered an error verifying credentials.");
    } finally {
      setProfessionalLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    setIsSavingProfile(true)
    try {
      const response = await fetch("/api/provider/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          bio,
          profilePhoto,
          servicesOffered: services,
          location,
          portfolio: portfolio,
          category: selectedCategories.join(',')
        })
      });
      if (response.ok) {
        setIsProfileComplete(true)
        updateProfile({ isProfileComplete: true })
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleEditSection = (step: number) => {
    setWizardStep(step);
    setIsProfileComplete(false); // Temporarily drop out of complete mode to show the wizard
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => {
                logout()
                window.location.href = "/"
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Verification Banner */}
        {!isVerified && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("verify.dialog.title")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === "ar" 
                  ? "قم بالتحقق من هويتك ومؤهلاتك المهنية لتفعيل ملفك الشخصي." 
                  : locale === "fr" 
                  ? "Vérifiez votre identité et vos qualifications professionnelles pour activer votre profil." 
                  : "Verify your identity and professional credentials to activate your profile."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Card 1: Identity Verification */}
              <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/20 flex flex-col justify-between text-left">
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">{t("verify.identity.title")}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                      dbProvider?.identityStatus === "APPROVED"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : dbProvider?.identityStatus === "PENDING"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : dbProvider?.identityStatus === "REJECTED"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-zinc-500/10 text-zinc-500 border-zinc-700"
                    )}>
                      {dbProvider?.identityStatus === "APPROVED" ? t("provider.verified") :
                       dbProvider?.identityStatus === "PENDING" ? (locale === "ar" ? "قيد المراجعة" : locale === "fr" ? "En attente" : "Pending") :
                       dbProvider?.identityStatus === "REJECTED" ? (locale === "ar" ? "مرفوض" : locale === "fr" ? "Rejeté" : "Rejected") :
                       (locale === "ar" ? "غير مرسل" : locale === "fr" ? "Non soumis" : "Not Submitted")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("verify.identity.desc")}
                  </p>
                  {dbProvider?.identityStatus === "REJECTED" && dbProvider?.certificateMessage && (
                    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-2 rounded-lg italic">
                      "{dbProvider.certificateMessage}"
                    </p>
                  )}
                </div>

                {dbProvider?.identityStatus !== "APPROVED" && (
                  dbProvider?.identityStatus === "PENDING" ? (
                    <Button className="w-full font-semibold mt-2" variant="outline" disabled>
                      {locale === "ar" ? "قيد المراجعة..." : locale === "fr" ? "En cours d'examen..." : "Verification in Review..."}
                    </Button>
                  ) : (
                    <Dialog open={isIdentityDialogOpen} onOpenChange={(open) => {
                      setIsIdentityDialogOpen(open);
                      if (open) {
                        setIdentityMethod("yoti");
                        setManualIdFile(null);
                        setManualIdPreview(null);
                        setManualSelfieFile(null);
                        setManualSelfiePreview(null);
                        setIdentityUploadResult(null);
                        startDiditSession();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full font-semibold mt-2" variant="outline">
                          {dbProvider?.identityStatus === "REJECTED" ? t("verify.resubmitBtn") : t("verify.identity.startBtn")}
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-1.5 text-foreground">
                          {t("verify.identity.title")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          {locale === "ar" ? "اختر طريقة التحقق من الهوية" : locale === "fr" ? "Choisissez la méthode de vérification d'identité" : "Choose identity verification method"}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 my-2">
                        {/* Method choice */}
                        {!identityUploadResult && (
                          <div className="flex gap-2 p-1 bg-muted rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setIdentityMethod("yoti");
                                startDiditSession();
                              }}
                              className={cn(
                                "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
                                identityMethod === "yoti" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Didit Verification (Auto)
                            </button>
                            <button
                              type="button"
                              onClick={() => setIdentityMethod("manual")}
                              className={cn(
                                "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
                                identityMethod === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {t("verify.manual.title")}
                            </button>
                          </div>
                        )}

                        {/* Yoti Option */}
                        {identityMethod === "yoti" && !identityUploadResult && (
                          <div className="space-y-4 text-center">
                            <p className="text-xs text-muted-foreground text-left">
                              {t("verify.step2.prompt.yoti")}
                            </p>
                            {diditLoading ? (
                              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-xs text-muted-foreground">Initializing Didit Verification...</p>
                              </div>
                            ) : diditSessionId && diditSessionUrl ? (
                              <div className="space-y-3">
                                <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
                                  <iframe
                                    src={diditSessionUrl}
                                    allow="camera"
                                    className="w-full h-full border-none"
                                    title="Didit Verification"
                                  />
                                </div>
                                <div className="text-center my-1">
                                  <a 
                                    href={diditSessionUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-primary underline hover:text-primary/80"
                                  >
                                    Open verification in a new window
                                  </a>
                                </div>
                                <Button
                                  onClick={handleIdentitySubmit}
                                  className="w-full font-semibold"
                                  disabled={identityLoading}
                                >
                                  {identityLoading ? t("common.loading") : (locale === "ar" ? "إكمال التحقق" : locale === "fr" ? "Compléter la vérification" : "Complete Verification")}
                                </Button>
                              </div>
                            ) : (
                              <div className="p-4 text-center rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                Failed to load Didit verification session.
                                <Button size="sm" className="mt-3 block mx-auto" onClick={startDiditSession}>Retry</Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Manual Option */}
                        {identityMethod === "manual" && !identityUploadResult && (
                          <div className="space-y-4 text-left">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.manual.idLabel")}</label>
                              <FileUpload
                                id="manual-id-upload"
                                label={t("verify.step2.uploadLabel")}
                                onFileSelect={(f) => {
                                  setManualIdFile(f);
                                  setManualIdPreview(f ? URL.createObjectURL(f) : null);
                                }}
                              />
                              {manualIdPreview && (
                                <div className="mt-2 relative rounded-xl overflow-hidden border border-border max-h-32">
                                  <img src={manualIdPreview} alt="ID Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.manual.selfieLabel")}</label>
                              <FileUpload
                                id="manual-selfie-upload"
                                label={t("webcam.capture")}
                                onFileSelect={(f) => {
                                  setManualSelfieFile(f);
                                  setManualSelfiePreview(f ? URL.createObjectURL(f) : null);
                                }}
                              />
                              {manualSelfiePreview && (
                                <div className="mt-2 relative rounded-xl overflow-hidden border border-border max-h-32">
                                  <img src={manualSelfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={handleIdentitySubmit}
                              className="w-full font-semibold mt-2"
                              disabled={identityLoading || !manualIdFile || !manualSelfieFile}
                            >
                              {identityLoading ? t("verify.audit.analyzing") : t("verify.submitBtn")}
                            </Button>
                          </div>
                        )}

                        {/* Post Upload Result */}
                        {identityUploadResult && (
                          <div className="space-y-4 text-sm text-left">
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
                              <h4 className="font-bold text-primary text-base">🎉 {t("verify.audit.success")}</h4>
                              <p className="text-xs text-muted-foreground">
                                {locale === "ar" 
                                  ? "تم استلام مستندات الهوية الخاصة بك. سيقوم المشرف بمراجعتها قريبًا." 
                                  : locale === "fr" 
                                  ? "Vos documents d'identité ont été reçus. Un administrateur les révisera sous peu." 
                                  : "Your identity documents have been received. An administrator will review them shortly."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  )
                )}
              </div>

              {/* Card 2: Professional Credentials Verification */}
              <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/20 flex flex-col justify-between text-left">
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">{t("verify.professional.title")}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                      currentProfessionalStatus === "VERIFIED"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : currentProfessionalStatus === "PENDING"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : currentProfessionalStatus === "REJECTED"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-zinc-500/10 text-zinc-500 border-zinc-700"
                    )}>
                      {currentProfessionalStatus === "VERIFIED" ? t("provider.verified") :
                       currentProfessionalStatus === "PENDING" ? (locale === "ar" ? "قيد المراجعة" : locale === "fr" ? "En attente" : "Pending") :
                       currentProfessionalStatus === "REJECTED" ? (locale === "ar" ? "مرفوض" : locale === "fr" ? "Rejeté" : "Rejected") :
                       (locale === "ar" ? "غير مرسل" : locale === "fr" ? "Non soumis" : "Not Submitted")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("verify.professional.desc")}
                  </p>
                  {currentProfessionalStatus === "REJECTED" && currentProfessionalRejectionReason && (
                    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-2 rounded-lg italic">
                      "{currentProfessionalRejectionReason}"
                    </p>
                  )}
                </div>

                {currentProfessionalStatus !== "VERIFIED" && (
                  <Dialog open={isProfessionalDialogOpen} onOpenChange={(open) => {
                    setIsProfessionalDialogOpen(open);
                    if (open) {
                      setSelectedCategory(dbProvider?.category || null);
                      setSubCategoryId("");
                      setCustomActivityName("");
                      setCertificateId("");
                      setCertFile(null);
                      setCertPreview(null);
                      setProfessionalUploadResult(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full font-semibold mt-2" variant="outline">
                        {currentProfessionalStatus === "REJECTED" ? t("verify.resubmitBtn") : t("verify.professional.startBtn")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-1.5 text-foreground">
                          {t("verify.professional.title")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          {t("verify.category.prompt")}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 my-2 text-left">
                        {!professionalUploadResult && (
                          <>
                            {/* Category selection */}
                            <div className="grid grid-cols-1 gap-2.5">
                              {/* Regulated */}
                              <button
                                type="button"
                                onClick={() => { setSelectedCategory("regulated_profession"); setSubCategoryId(""); }}
                                className={cn(
                                  "p-3.5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-sm flex items-center gap-3",
                                  selectedCategory === "regulated_profession" ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">{t("regulated_profession")}</h4>
                                </div>
                              </button>
                              {/* Artisan */}
                              <button
                                type="button"
                                onClick={() => { setSelectedCategory("artisan"); setSubCategoryId(""); }}
                                className={cn(
                                  "p-3.5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-sm flex items-center gap-3",
                                  selectedCategory === "artisan" ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                                  <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">{t("artisan")}</h4>
                                </div>
                              </button>
                              {/* Auto Entrepreneur */}
                              <button
                                type="button"
                                onClick={() => { setSelectedCategory("auto_entrepreneur"); setSubCategoryId(""); }}
                                className={cn(
                                  "p-3.5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-sm flex items-center gap-3",
                                  selectedCategory === "auto_entrepreneur" ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center shrink-0">
                                  <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">{t("auto_entrepreneur")}</h4>
                                </div>
                              </button>
                            </div>

                            {/* Subfields */}
                            {selectedCategory === "regulated_profession" && (
                              <div className="space-y-3 animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.regulatory.label")}</label>
                                  <Select onValueChange={setSubCategoryId} value={subCategoryId}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={t("verify.regulatory.placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {metadataCategories.find(c => c.name === 'regulated_profession')?.regulatoryBodies.map((body: any) => (
                                        <SelectItem key={body.id} value={body.id}>{body.code} — {locale === "ar" ? body.nameAr : locale === "fr" ? body.nameFr : body.nameEn}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {selectedCategory === "artisan" && (
                              <div className="space-y-3 animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.trade.label")}</label>
                                  <Select onValueChange={setSubCategoryId} value={subCategoryId}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={t("verify.trade.placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-48">
                                      {metadataCategories.find(c => c.name === 'artisan')?.trades.map((trade: any) => (
                                        <SelectItem key={trade.id} value={trade.id}>{locale === "ar" ? trade.nameAr : locale === "fr" ? trade.nameFr : trade.nameEn}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {selectedCategory === "auto_entrepreneur" && (
                              <div className="space-y-3 animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.activity.label")}</label>
                                  <Select onValueChange={setSubCategoryId} value={subCategoryId}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={t("verify.activity.placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-48">
                                      {metadataCategories.find(c => c.name === 'auto_entrepreneur')?.autoEntrepreneurActivities.map((act: any) => (
                                        <SelectItem key={act.id} value={act.id}>{locale === "ar" ? act.nameAr : locale === "fr" ? act.nameFr : act.nameEn}</SelectItem>
                                      ))}
                                      <SelectItem value="other">{t("verify.activity.other")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {subCategoryId === "other" && (
                                  <div className="space-y-1 animate-in slide-in-from-top-1.5 duration-200">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">{t("verify.activity.customLabel")}</label>
                                    <input
                                      type="text"
                                      value={customActivityName}
                                      onChange={(e) => setCustomActivityName(e.target.value)}
                                      placeholder={t("verify.activity.customPlaceholder")}
                                      className="w-full border border-input rounded-xl p-3 bg-background outline-none text-sm h-11"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* File Upload */}
                            {selectedCategory && (
                              <div className="space-y-3 pt-3 border-t border-border animate-in fade-in duration-200">
                                <FileUpload
                                  id="professional-card-upload"
                                  label={
                                    selectedCategory === 'regulated_profession'
                                      ? t("verify.step4.uploadReg")
                                      : selectedCategory === 'artisan'
                                      ? t("verify.step4.uploadArt")
                                      : t("verify.step4.uploadAuto")
                                  }
                                  onFileSelect={(f) => {
                                    setCertFile(f);
                                    setCertPreview(f ? URL.createObjectURL(f) : null);
                                  }}
                                />

                                {certPreview && (
                                  <div className="relative rounded-xl overflow-hidden border border-border max-h-36 mt-2">
                                    <img src={certPreview} alt="Card Preview" className="w-full h-full object-cover" />
                                  </div>
                                )}

                                {professionalLoading && (
                                  <div className="p-3 bg-muted/50 border border-border rounded-xl text-center text-xs animate-pulse text-muted-foreground">
                                    {t("verify.audit.running")}
                                  </div>
                                )}

                                <Button
                                  onClick={handleProfessionalSubmit}
                                  disabled={professionalLoading || !certFile || !subCategoryId || (subCategoryId === "other" && !customActivityName.trim())}
                                  className="w-full font-semibold mt-2"
                                >
                                  {professionalLoading ? t("verify.audit.analyzing") : t("verify.submitBtn")}
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Post Upload OCR pre-audit result display */}
                        {professionalUploadResult && (
                          <div className="space-y-4 text-sm animate-in zoom-in-95 duration-300">
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-2.5">
                              <h4 className="font-bold text-primary text-base flex items-center gap-1.5">
                                🎉 {t("verify.audit.success")}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {t("verify.audit.desc")}
                              </p>
                              
                              <div className="space-y-1.5 pt-1 text-xs">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span className={professionalUploadResult.ai_audit?.names_match ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                    {professionalUploadResult.ai_audit?.names_match ? "✓" : "!"}
                                  </span>
                                  <span>{professionalUploadResult.ai_audit?.names_match ? t("verify.audit.nameOk") : t("verify.audit.nameFail")}</span>
                                </div>
                              </div>

                              <div className="border-t border-primary/20 pt-2 text-xs italic text-muted-foreground">
                                "{professionalUploadResult.ai_audit?.message}"
                              </div>
                            </div>

                            <div className="p-3 bg-muted border border-border rounded-xl text-center text-xs text-muted-foreground">
                              {t("verify.audit.adminHint")}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Completion Form - Wizard */}
        {isVerified && !isProfileComplete && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {t("wizard.step")
                  .replace("{step}", wizardStep.toString())
                  .replace("{name}", 
                    wizardStep === 1 ? t("wizard.step.basic") : 
                    wizardStep === 2 ? t("wizard.step.services") : 
                    t("wizard.step.portfolio")
                  )}
              </h2>
              <div className="flex gap-2">
                <div className={`w-3 h-3 rounded-full ${wizardStep >= 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className={`w-3 h-3 rounded-full ${wizardStep >= 2 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className={`w-3 h-3 rounded-full ${wizardStep >= 3 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              </div>
            </div>
            
            {/* Step 1: Basic Info */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("wizard.photo")}</label>
                  <FileUpload
                    id="profile-photo-upload"
                    accept="image/png,image/jpeg,image/webp"
                    onFileSelect={handleProfilePhotoSelect}
                    label={t("wizard.photo")}
                  />
                  {uploadingProfilePhoto && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading profile photo...
                    </div>
                  )}
                  {!uploadingProfilePhoto && profilePhoto && (
                    <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-border">
                       <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("wizard.category")}</label>
                  <p className="text-sm text-muted-foreground mb-2">{t("wizard.categoryHint")}</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        disabled={true}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border opacity-80 cursor-not-allowed ${
                          selectedCategories.includes(cat.id)
                            ? "bg-primary/20 text-primary border-primary/30 font-bold"
                            : "bg-background text-muted-foreground border-input"
                        }`}
                      >
                        {t(cat.id)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("wizard.bio")}</label>
                  <textarea 
                    className="w-full border border-input rounded-xl p-3 bg-background resize-none h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("wizard.bioPlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("wizard.location")}</label>
                  <Select onValueChange={setLocation} value={location}>
                    <SelectTrigger className="w-full bg-background rounded-xl p-3 h-12 border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                      <SelectValue placeholder={t("wizard.locationPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ALGERIAN_WILAYAS.map((wilaya) => (
                        <SelectItem key={wilaya} value={wilaya}>
                          {wilaya}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => setWizardStep(2)} 
                  disabled={bio.length < 10 || selectedCategories.length === 0 || !location || uploadingProfilePhoto}
                  className="w-full sm:w-auto"
                >
                  {t("wizard.saveNext")}
                </Button>
              </div>
            )}

            {/* Step 2: Services */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-muted-foreground text-sm">{t("wizard.step2.desc")}</p>
                <div className="space-y-3">
                  {services.map((svc, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 p-3 border border-border rounded-xl bg-background/50">
                      <input 
                        className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background" 
                        placeholder={t("wizard.service.placeholder")} 
                        value={svc.name} onChange={e => updateService(idx, "name", e.target.value)} 
                      />
                      <input 
                        className="w-full sm:w-24 border border-input rounded-lg px-3 py-2 text-sm bg-background" 
                        placeholder={t("wizard.price.placeholder")} 
                        value={svc.price} onChange={e => updateService(idx, "price", e.target.value)} 
                      />
                      <input 
                        className="w-full sm:w-32 border border-input rounded-lg px-3 py-2 text-sm bg-background" 
                        placeholder={t("wizard.duration.placeholder")} 
                        value={svc.duration} onChange={e => updateService(idx, "duration", e.target.value)} 
                      />
                      <Button variant="destructive" size="icon" onClick={() => removeService(idx)} className="shrink-0 h-9 w-9">
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={addService} className="w-full sm:w-auto border-dashed">
                  {t("wizard.addService")}
                </Button>
                <div className="flex gap-2 pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(1)}>{t("wizard.back")}</Button>
                  <Button onClick={() => setWizardStep(3)} disabled={services.length === 0 || services.some(s => !s.name)}>
                    {t("wizard.saveNextPortfolio")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Portfolio */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-muted-foreground text-sm">{t("wizard.step3.desc")}</p>
                <div className="space-y-3">
                  {portfolio.map((img, idx) => (
                    <div key={idx} className="flex gap-2 p-3 border border-border rounded-xl bg-background/50">
                      <input 
                        className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background" 
                        placeholder={t("wizard.imgUrl.placeholder")} 
                        value={img} onChange={e => updatePortfolioItem(idx, e.target.value)} 
                      />
                      <Button variant="destructive" size="icon" onClick={() => removePortfolioItem(idx)} className="shrink-0 h-9 w-9">
                        &times;
                      </Button>
                    </div>
                  ))}
                  {portfolio.length === 0 && (
                     <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                        {t("wizard.emptyPortfolio")}
                     </div>
                  )}
                </div>
                <Button variant="outline" onClick={addPortfolioItem} className="w-full sm:w-auto border-dashed">
                  {t("wizard.addPortfolioImg")}
                </Button>
                
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mt-4">
                  <h3 className="font-semibold flex items-center mb-1"><BadgeCheck className="w-4 h-4 mr-2" /> {t("wizard.readyTitle")}</h3>
                  <p className="text-sm">{t("wizard.readyDesc")}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(2)}>{t("wizard.back")}</Button>
                  <Button onClick={handleCompleteProfile} disabled={isSavingProfile || portfolio.some(a => !a)}>
                    {isSavingProfile ? t("wizard.saving") : t("wizard.goPublic")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              {isVerified ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                  {profilePhoto ? (
                    <Image
                      src={profilePhoto}
                      alt={dbProvider?.name || user?.username || "Username"}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <BadgeCheck className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {isVerified ? dbProvider?.name || user?.username || "Username" : user?.username || "Username"}
                  </h1>
                  {isVerified ? (
                    <>
                      <p className="text-muted-foreground">{dbProvider?.title || "Service Provider"}</p>
                      <div className="flex items-center gap-2 mt-2" dir="ltr">
                        <StarRating rating={dbProvider?.rating || 0} size="sm" showValue />
                        <span className="text-sm text-muted-foreground">
                          ({dbProvider?.reviewCount || 0} {t("discover.reviews")})
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("provider.activateHint")}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleEditSection(1)}>
                  <Edit className="w-4 h-4 mr-1" />
                  {t("profile.edit")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Following sections only show when EVERYTHING is complete */}
        {isProfileComplete && (
          <>
            {/* Bio Section */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-3">{t("provider.about")}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {bio}
              </p>
            </div>
        {/* Services Section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{t("provider.servicesOffered")}</h2>
            <Button variant="ghost" size="sm" onClick={() => handleEditSection(2)}>
              <Edit className="w-4 h-4 mr-1" />
              {t("profile.edit")}
            </Button>
          </div>
          <div className="space-y-3">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                name={service.name}
                price={service.price}
                duration={service.duration}
              />
            ))}
          </div>
        </div>



        {/* Portfolio Section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{t("wizard.step.portfolio")}</h2>
            <Button variant="ghost" size="sm" onClick={() => handleEditSection(3)}>
              <Edit className="w-4 h-4 mr-1" />
              {t("provider.manageWork")}
            </Button>
          </div>
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {portfolio.map((imgUrl, i) => (
                <div
                  key={i}
                  className="aspect-square bg-muted rounded-xl flex items-center justify-center overflow-hidden"
                >
                  <img src={imgUrl} alt={`Portfolio ${i}`} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-xl bg-muted/50 border border-dashed border-border text-sm text-muted-foreground">
               {t("provider.noPortfolio")}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              {t("provider.reviews")} <span dir="ltr">({dbProvider?.reviewCount || 0})</span>
            </h2>
          </div>
          {providerReviews.length > 0 ? (
            <div className="space-y-4">
              {providerReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("provider.reviewsHint")}
            </p>
          )}
        </div>
      </>
    )}

    {/* Fallback skeleton sections if Profile isn't fully active yet */}
    {!isProfileComplete && (
      <>
        <SkeletonCard title={t("provider.about")} />
        <SkeletonCard title={t("provider.servicesOffered")} />

        <SkeletonCard title={t("wizard.step.portfolio")} />
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">{t("provider.reviews")} (0)</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {t("provider.reviewsInactiveHint")}
            </p>
          </div>
        </div>
      </>
    )}
      </div>
    </main>
  )
}
