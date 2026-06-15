"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/marketplace/header"
import { Footer } from "@/components/marketplace/footer"

interface LayoutShellProps {
  children: React.ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname()
  
  // Routes that shouldn't show the standard header and footer
  const standaloneRoutes = ["/login", "/signup", "/forgot-password"]
  const isStandalone = standaloneRoutes.some((route) => pathname.startsWith(route))

  if (isStandalone) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex flex-col w-full">
        {children}
      </div>
      <Footer />
    </div>
  )
}
