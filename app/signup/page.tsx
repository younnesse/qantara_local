"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/marketplace/app-logo"
import { ProgressBar } from "@/components/marketplace/progress-bar"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowLeft, Stethoscope, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export default function SignUpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useLanguage()
  
  // Step State
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<"provider" | "consumer" | null>(null)

  // Auth/Step 1 State
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Form loader
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // All Form Data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Step 2
    bio: "",
    title: "",
    phone: "",

    // Step 3
    serviceName: "",
    servicePrice: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleNextStep = () => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!selectedRole) newErrors.role = t("signup.roleRequired")
      if (!formData.username.trim()) newErrors.username = t("signup.fullNameRequired")
      if (!formData.email.trim()) newErrors.email = t("signup.emailRequired")
      if (!formData.password) newErrors.password = t("signup.passwordRequired")
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t("signup.passwordsNoMatch")
      if (!agreedToTerms) newErrors.terms = t("signup.termsRequired")
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (currentStep === 1 && selectedRole === "consumer") {
      finishSignup()
    } else if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      finishSignup()
    }
  }

  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      finishSignup()
    }
  }

  const [signupSuccess, setSignupSuccess] = useState(false)
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [verifySuccess, setVerifySuccess] = useState(false)

  const finishSignup = async () => {
    setIsLoading(true);
    setErrors({})

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          role: selectedRole?.toUpperCase()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ email: data.error || t("signup.failed") })
        setIsLoading(false)
        setCurrentStep(1)
        return
      }

      setIsLoading(false)
      setSignupSuccess(true)
      startResendTimer()
    } catch (err) {
      console.error(err)
      setErrors({ email: t("signup.unexpectedError") })
      setIsLoading(false)
      setCurrentStep(1)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setVerificationCode(pasted.split(""))
      const lastInput = document.getElementById("code-5")
      lastInput?.focus()
      autoSubmitCode(pasted)
    }
  }

  const handleVerifyCode = async () => {
    const code = verificationCode.join("")
    if (code.length !== 6) {
      setVerifyError(t("signup.enterFullCode"))
      return
    }
    autoSubmitCode(code)
  }

  // Resend timer
  const [resendTimer, setResendTimer] = useState(45)
  const [canResend, setCanResend] = useState(false)
  const [shakeError, setShakeError] = useState(false)

  // Start resend timer when OTP screen shows
  const startResendTimer = () => {
    setResendTimer(45)
    setCanResend(false)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return interval
  }

  const handleResendCode = async () => {
    if (!canResend) return
    try {
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          role: selectedRole?.toUpperCase(),
        }),
      })
      setVerificationCode(["", "", "", "", "", ""])
      setVerifyError("")
      startResendTimer()
      document.getElementById("code-0")?.focus()
    } catch {
      setVerifyError(t("signup.resendFailed"))
    }
  }

  // Auto-submit when all 6 digits are entered
  const handleCodeChangeEnhanced = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    setVerifyError("")
    setShakeError(false)

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when 6th digit entered
    if (value && index === 5) {
      const fullCode = newCode.join("")
      if (fullCode.length === 6) {
        autoSubmitCode(fullCode)
      }
    }
  }

  const autoSubmitCode = async (code: string) => {
    setVerifyLoading(true)
    setVerifyError("")

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      })

      const data = await res.json()

      if (res.ok) {
        setVerifySuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setVerifyError(data.error || t("signup.failed"))
        setShakeError(true)
        setVerificationCode(["", "", "", "", "", ""])
        setTimeout(() => {
          setShakeError(false)
          document.getElementById("code-0")?.focus()
        }, 600)
      }
    } catch {
      setVerifyError(t("signup.unexpectedError"))
      setShakeError(true)
      setTimeout(() => setShakeError(false), 600)
    } finally {
      setVerifyLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="mb-8">
          <AppLogo />
        </div>
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
          {verifySuccess ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t("signup.emailVerified")}</h2>
              <p className="text-muted-foreground">{t("signup.redirecting")}</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("signup.enterCode")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("signup.codeSentTo")} <span className="font-medium text-foreground">{formData.email}</span>
              </p>

              {/* 6-digit code input with shake animation */}
              <div
                dir="ltr"
                className={`flex justify-center gap-2 mb-6 transition-transform ${
                  shakeError ? "animate-[shake_0.5s_ease-in-out]" : ""
                }`}
                onPaste={handleCodePaste}
                style={shakeError ? {
                  animation: "shake 0.5s ease-in-out",
                } : undefined}
              >
                {verificationCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChangeEnhanced(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl bg-background outline-none transition-all ${
                      shakeError
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : digit
                        ? "border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                    autoFocus={i === 0}
                    disabled={verifyLoading}
                  />
                ))}
              </div>

              {verifyError && (
                <p className="text-sm text-destructive mb-4 animate-in fade-in duration-200">{verifyError}</p>
              )}

              {verifyLoading && (
                <div className="flex items-center justify-center gap-2 mb-4 text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">{t("signup.verifying")}</span>
                </div>
              )}

              <Button
                className="w-full h-12 text-base"
                onClick={handleVerifyCode}
                disabled={verifyLoading || verificationCode.join("").length !== 6}
              >
                {verifyLoading ? t("signup.verifying") : t("signup.verifyEmail")}
              </Button>

              {/* Resend Timer */}
              <div className="mt-4">
                {canResend ? (
                  <button
                    onClick={handleResendCode}
                    className="text-sm text-primary font-medium hover:underline transition-colors"
                  >
                    {t("signup.resendCode")}
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("signup.resendCodeIn")}{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:{String(resendTimer % 60).padStart(2, "0")}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Shake animation keyframes */}
        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
        `}</style>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(p => p - 1) : router.push('/')}
            className="p-2 rounded-xl hover:bg-muted transition-colors animate-all"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
          </button>
          <AppLogo size="sm" />
        </div>

        {selectedRole === "provider" && <ProgressBar currentStep={currentStep} totalSteps={3} className="mb-8" />}

        <div className="space-y-2 mb-8 animate-in fade-in duration-300">
          <h1 className="text-2xl font-bold">
            {currentStep === 1 && t("signup.createAccount")}
            {currentStep === 2 && t("signup.profileDetails")}
            {currentStep === 3 && t("signup.initialSetup")}
          </h1>
          <p className="text-muted-foreground">
            {currentStep === 1 && t("signup.subtitle1")}
            {currentStep === 2 && t("signup.subtitle2")}
            {currentStep === 3 && t("signup.subtitle3")}
          </p>
        </div>

        <div className="space-y-6">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <Label>{t("signup.roleSelect")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("provider"); if (errors.role) setErrors((p) => ({ ...p, role: "" })) }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRole === "provider" ? "border-primary bg-primary/5 shadow-sm scale-102" : "border-border hover:border-primary/50"}`}
                  >
                    <div className={`p-3 rounded-xl ${selectedRole === "provider" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{t("login.serviceProvider")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRole("consumer"); if (errors.role) setErrors((p) => ({ ...p, role: "" })) }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRole === "consumer" ? "border-primary bg-primary/5 shadow-sm scale-102" : "border-border hover:border-primary/50"}`}
                  >
                    <div className={`p-3 rounded-xl ${selectedRole === "consumer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{t("login.consumer")}</span>
                  </button>
                </div>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t("signup.fullName")}</Label>
                <Input id="username" name="username" placeholder={t("signup.fullNamePlaceholder")} value={formData.username} onChange={handleInputChange} className={errors.username ? "border-destructive h-11 rounded-xl" : "h-11 rounded-xl"} />
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("signup.emailOrPhone")}</Label>
                <Input id="email" name="email" type="text" placeholder={t("signup.emailPlaceholder")} value={formData.email} onChange={handleInputChange} className={errors.email ? "border-destructive h-11 rounded-xl" : "h-11 rounded-xl"} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("signup.password")}</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder={t("signup.passwordPlaceholder")} value={formData.password} onChange={handleInputChange} className={errors.password ? "border-destructive pr-10 h-11 rounded-xl" : "pr-10 h-11 rounded-xl"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("signup.confirmPassword")}</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t("signup.confirmPasswordPlaceholder")} value={formData.confirmPassword} onChange={handleInputChange} className={errors.confirmPassword ? "border-destructive pr-10 h-11 rounded-xl" : "pr-10 h-11 rounded-xl"} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start gap-3 mt-4">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} className="mt-1" />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer font-normal">
                  {t("signup.termsAgree")}{" "}
                  <a href="/terms" className="text-primary font-medium hover:underline">
                    {t("signup.termsLink")}
                  </a>{" "}
                  {t("signup.and")}{" "}
                  <a href="/privacy" className="text-primary font-medium hover:underline">
                    {t("signup.privacyLink")}
                  </a>
                </Label>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <Label htmlFor="title">{t("signup.proTitle")}</Label>
                 <Input id="title" name="title" placeholder={t("signup.proTitlePlaceholder")} value={formData.title} onChange={handleInputChange} className="h-11 rounded-xl" />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="phone">{t("signup.phone")}</Label>
                 <Input id="phone" name="phone" placeholder="+213 555 00 00 00" value={formData.phone} onChange={handleInputChange} className="h-11 rounded-xl" />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="bio">{t("signup.bio")}</Label>
                 <Textarea id="bio" name="bio" rows={4} placeholder={t("signup.bioPlaceholder")} value={formData.bio} onChange={handleInputChange} className="rounded-xl resize-none" />
               </div>
             </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <Label htmlFor="serviceName">{t("signup.serviceName")}</Label>
                 <Input id="serviceName" name="serviceName" placeholder={t("signup.serviceNamePlaceholder")} value={formData.serviceName} onChange={handleInputChange} className="h-11 rounded-xl" />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="servicePrice">{t("signup.servicePrice")}</Label>
                 <Input id="servicePrice" name="servicePrice" type="number" placeholder="1500" value={formData.servicePrice} onChange={handleInputChange} className="h-11 rounded-xl" />
               </div>
             </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
             <Button onClick={handleNextStep} className="w-full h-12 text-base rounded-xl font-semibold transition-all hover:shadow-md active:scale-98" disabled={isLoading}>
               {isLoading ? t("signup.processing") : ((currentStep === 1 && selectedRole === "consumer") || currentStep === 3 ? t("signup.completeSignUp") : t("signup.continue"))}
             </Button>

             {currentStep > 1 && (
               <Button onClick={handleSkip} variant="outline" className="w-full h-12 text-base rounded-xl font-semibold hover:bg-muted" disabled={isLoading}>
                 {currentStep === 3 ? t("signup.skipAndFinish") : t("signup.skip")}
               </Button>
             )}
          </div>

          {currentStep === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("signup.haveAccount")}{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                {t("signup.signIn")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
