export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <section className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
          <div className="text-center animate-pulse">
            <div className="h-12 w-80 mx-auto bg-botanical-surface rounded-lg mb-6" />
            <div className="h-6 w-96 mx-auto bg-botanical-surface rounded" />
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-botanical-surface rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm overflow-hidden">
                <div className="h-48 bg-botanical-surface" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-botanical-surface rounded" />
                  <div className="h-4 w-full bg-botanical-surface rounded" />
                  <div className="h-10 w-full bg-botanical-surface rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

