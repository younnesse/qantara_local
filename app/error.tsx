"use client"

import { useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

const messages = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or return to the home page.",
    retry: "Try again",
    home: "Go home",
  },
  fr: {
    title: "Une erreur est survenue",
    description: "Une erreur inattendue s'est produite. Veuillez réessayer ou revenir à l'accueil.",
    retry: "Réessayer",
    home: "Accueil",
  },
  ar: {
    title: "حدث خطأ ما",
    description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.",
    retry: "إعادة المحاولة",
    home: "الرئيسية",
  },
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { locale } = useLanguage()
  const msg = messages[locale] || messages.en

  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{msg.title}</h1>
      <p className="text-muted-foreground max-w-sm mb-8">{msg.description}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset} className="rounded-xl gap-2">
          <RotateCcw className="w-4 h-4" />
          {msg.retry}
        </Button>
        <Link href="/">
          <Button className="rounded-xl gap-2">
            <Home className="w-4 h-4" />
            {msg.home}
          </Button>
        </Link>
      </div>
    </main>
  )
}
