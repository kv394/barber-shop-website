import Image from 'next/image';
export default function Loading() {
 return (
 <main className="min-h-screen" style={{ background: '#f4f5f7' }}>
  <section style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
   <div className="text-center animate-pulse">
   <div className="h-12 w-80 mx-auto rounded-lg mb-6" style={{ background: '#e5e7eb' }} />
   <div className="h-6 w-96 mx-auto rounded" style={{ background: '#e5e7eb' }} />
   </div>
  </div>
  </section>
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
  <div className="animate-pulse">
   <div className="h-8 w-48 rounded mb-8" style={{ background: '#e5e7eb' }} />
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
   {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
    <div className="h-48" style={{ background: '#e5e7eb' }} />
    <div className="p-6 space-y-3">
     <div className="h-6 w-3/4 rounded" style={{ background: '#e5e7eb' }} />
     <div className="h-4 w-full rounded" style={{ background: '#e5e7eb' }} />
     <div className="h-10 w-full rounded mt-4" style={{ background: '#e5e7eb' }} />
    </div>
    </div>
   ))}
   </div>
  </div>
  </section>
 </main>
 );
}
