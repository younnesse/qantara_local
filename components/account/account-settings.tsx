"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Shield, Mail, Lock } from "lucide-react"

export function AccountSettings() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          role: user?.role,
          email: email !== user?.email ? email : undefined,
          password: password ? password : undefined
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Account updated successfully!")
        setPassword("") // clear password field
      } else {
        setMessage(data.error || "Failed to update account.")
      }
    } catch (err) {
      setMessage("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Security & Login</h2>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">New Password (leave blank to keep current)</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {message && <p className="text-sm font-medium text-primary mt-2">{message}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
