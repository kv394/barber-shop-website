export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Nav skeleton */}
      <div className="flex gap-4 mb-6 sm:mb-8 border-b border-botanical-border pb-3 sm:pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 w-20 bg-botanical-surface rounded" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-botanical-surface p-4 sm:p-8 rounded-xl border border-botanical-border">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-botanical-bg/50 rounded-xl p-4 sm:p-6 border border-botanical-border">
              <div className="h-3 w-16 bg-botanical-surface rounded mb-3" />
              <div className="h-8 w-20 bg-botanical-border rounded" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-botanical-bg/30 border border-botanical-border">
              <div className="h-4 w-4 bg-botanical-surface rounded-full" />
              <div className="h-4 flex-1 bg-botanical-surface rounded" />
              <div className="h-4 w-24 bg-botanical-surface rounded" />
              <div className="h-4 w-16 bg-botanical-surface rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

