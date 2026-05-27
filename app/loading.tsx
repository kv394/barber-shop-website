export default function Loading() {
 return (
 <div className="flex min-h-screen items-center justify-center bg-crm-bg">
 <div className="flex flex-col items-center gap-4">
 <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin" />
 <p className="text-crm-muted animate-pulse text-[13px]">Loading…</p>
 </div>
 </div>
 );
}

