"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/marketplace/app-logo"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Stethoscope, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"provider" | "consumer" | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = t("login.emailRequired")
    if (!formData.password) newErrors.password = t("login.passwordRequired")
    if (!selectedRole) newErrors.role = t("login.roleRequired")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrors({})
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password, role: selectedRole?.toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ email: data.error || t("login.failed") })
        setIsLoading(false)
        return
      }
      login(data.user)
      router.push(data.user.role === "provider" ? "/provider/profile" : "/")
    } catch (err) {
      console.error(err)
      setErrors({ email: t("login.unexpectedError") })
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
          </Link>
          <AppLogo size="sm" />
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t("login.title")}</h1>
          <p className="text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>{t("login.iam")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedRole("provider"); if (errors.role) setErrors((p) => ({ ...p, role: "" })) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRole === "provider" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className={`p-3 rounded-xl ${selectedRole === "provider" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{t("login.serviceProvider")}</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole("consumer"); if (errors.role) setErrors((p) => ({ ...p, role: "" })) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRole === "consumer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className={`p-3 rounded-xl ${selectedRole === "consumer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{t("login.consumer")}</span>
              </button>
            </div>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.emailOrPhone")}</Label>
              <Input id="email" name="email" type="text" placeholder={t("login.emailPlaceholder")} value={formData.email} onChange={handleInputChange} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">{t("login.forgotPassword")}</Link>
              </div>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder={t("login.passwordPlaceholder")} value={formData.password} onChange={handleInputChange} className={errors.password ? "border-destructive pr-10" : "pr-10"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? t("login.signingIn") : t("login.signIn")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">{t("login.signUp")}</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
