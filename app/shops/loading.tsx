export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <section className="bg-black/40 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
          <div className="text-center animate-pulse">
            <div className="h-12 w-80 mx-auto bg-white/5 rounded-lg mb-6" />
            <div className="h-6 w-96 mx-auto bg-white/5 rounded" />
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-white/5 rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="h-48 bg-white/5" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-white/5 rounded" />
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-10 w-full bg-white/5 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

