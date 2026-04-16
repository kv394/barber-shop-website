export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Nav skeleton */}
      <div className="flex gap-4 mb-6 sm:mb-8 border-b border-crm-border pb-3 sm:pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 w-20 bg-crm-surface rounded" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-crm-surface p-4 sm:p-8 rounded-xl border border-crm-border shadow-sm">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-crm-bg/50 rounded-xl p-4 sm:p-6 border border-crm-border shadow-sm">
              <div className="h-3 w-16 bg-crm-surface rounded mb-3" />
              <div className="h-8 w-20 bg-crm-border rounded" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-crm-bg/30 border border-crm-border shadow-sm">
              <div className="h-4 w-4 bg-crm-surface rounded-full" />
              <div className="h-4 flex-1 bg-crm-surface rounded" />
              <div className="h-4 w-24 bg-crm-surface rounded" />
              <div className="h-4 w-16 bg-crm-surface rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

