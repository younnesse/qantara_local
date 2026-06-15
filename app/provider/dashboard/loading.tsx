export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
              </div>
              <div className="h-7 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}
