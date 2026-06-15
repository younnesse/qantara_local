"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/marketplace/app-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.")
      }

      // On success, redirect to dashboard
      router.push("/admin/dashboard")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black -z-10" />
      
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="space-y-3 flex flex-col items-center pb-6">
          <AppLogo size="md" showText={true} />
          <div className="text-center pt-2">
            <CardTitle className="text-xl font-bold text-white tracking-tight">Admin Control Center</CardTitle>
            <CardDescription className="text-zinc-400 text-xs mt-1">
              Enter your credentials to access system management.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Administrator Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@qantara.com"
                required
                className="bg-black/40 border-zinc-800 focus-visible:ring-1 focus-visible:ring-primary h-11 text-sm text-white placeholder-zinc-600 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Security Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-black/40 border-zinc-800 focus-visible:ring-1 focus-visible:ring-primary h-11 text-sm text-white placeholder-zinc-600 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 font-semibold text-sm rounded-xl transition-all duration-200"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
