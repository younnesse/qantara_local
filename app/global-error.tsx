"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground max-w-sm mb-8">
            An unexpected error occurred. Please try again or return to the home page.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" />
              Try again
            </Button>
            <Link href="/">
              <Button className="rounded-xl gap-2">
                <Home className="w-4 h-4" />
                Go home
              </Button>
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
