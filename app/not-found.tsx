import { Button } from "@/components/ui/button"
import { Search, Home } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <Search className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved. Try searching for what you need.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="rounded-xl gap-2 px-6">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/consumer/search">
          <Button variant="outline" className="rounded-xl gap-2 px-6">
            <Search className="w-4 h-4" />
            Search Providers
          </Button>
        </Link>
      </div>
    </main>
  )
}
