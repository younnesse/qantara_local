export default function ProviderDetailsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Provider hero */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-28 h-28 rounded-full bg-muted animate-pulse" />
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="h-12 flex-1 rounded-xl bg-muted animate-pulse" />
          <div className="h-12 flex-1 rounded-xl bg-muted animate-pulse" />
        </div>

        {/* About */}
        <div className="space-y-3">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>

        {/* Services */}
        <div className="space-y-3">
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
