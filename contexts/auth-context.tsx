"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type UserRole = "provider" | "consumer" | null
export type ProviderStatus = "pending" | "verified"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  providerStatus?: ProviderStatus
  profileImage?: string
  title?: string
  bio?: string
  certificateUploaded?: boolean
  isProfileComplete?: boolean
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
  updateProviderStatus: (status: ProviderStatus) => void
  updateProfile: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch session on initial load
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("Failed to fetch session", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSession()
  }, [])

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Failed to logout", error)
    } finally {
      setUser(null)
      // Optional: window.location.href = "/" to force a hard refresh
    }
  }

  const updateProviderStatus = (status: ProviderStatus) => {
    if (user) {
      setUser({ ...user, providerStatus: status })
    }
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  if (isLoading) {
    // You could return a full-screen loading spinner here, but for now we just render nothing or children
    // to prevent flicker. To be safe, we can just return a simple blank screen during the initial millisecond check.
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        login,
        logout,
        updateProviderStatus,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
