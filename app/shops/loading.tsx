import Image from 'next/image';
export default function Loading() {
 return (
 <main className="min-h-screen" style={{ background: '#1a0b2e' }}>
  <section style={{ background: '#1a0b2e', borderBottom: '1px solid #2d164d' }}>
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
   <div className="text-center animate-pulse">
   <div className="h-12 w-80 mx-auto rounded-lg mb-6" style={{ background: '#2d164d' }} />
   <div className="h-6 w-96 mx-auto rounded" style={{ background: '#2d164d' }} />
   </div>
  </div>
  </section>
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
  <div className="animate-pulse">
   <div className="h-8 w-48 rounded mb-8" style={{ background: '#2d164d' }} />
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
   {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#1a0b2e', border: '1px solid #2d164d' }}>
    <div className="h-48" style={{ background: '#2d164d' }} />
    <div className="p-6 space-y-3">
     <div className="h-6 w-3/4 rounded" style={{ background: '#2d164d' }} />
     <div className="h-4 w-full rounded" style={{ background: '#2d164d' }} />
     <div className="h-10 w-full rounded mt-4" style={{ background: '#2d164d' }} />
    </div>
    </div>
   ))}
   </div>
  </div>
  </section>
 </main>
 );
}
