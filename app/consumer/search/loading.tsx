export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-12 flex-1 rounded-xl bg-muted animate-pulse" />
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Category chips */}
        <div className="flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 rounded-full bg-muted animate-pulse shrink-0" />
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-muted animate-pulse" />
          ))}
        </div>

        {/* Results count */}
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
