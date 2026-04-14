export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-botanical-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-botanical-muted animate-pulse text-base md:text-lg">Loading…</p>
      </div>
    </div>
  );
}

