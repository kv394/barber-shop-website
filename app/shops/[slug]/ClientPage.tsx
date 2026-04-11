'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import { usePathname } from 'next/navigation';

// Lazy-load the BookingModal component
const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
    ssr: false, // This component will only be rendered on the client side
    loading: () => <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center"><p className="text-white">Loading...</p></div>
});

/** Format the address object (or legacy string) into a single readable line */
function formatAddress(addr: any): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.street,
    addr.suite,
    addr.city,
    addr.state && addr.zip ? `${addr.state} ${addr.zip}` : (addr.state || addr.zip),
  ].filter(Boolean);
  return parts.join(', ');
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'opacity-100' : 'opacity-20'}>⭐</span>
      ))}
    </span>
  );
}

function ReviewsSection({ reviews, variant = 'dark' }: { reviews: any[]; variant?: 'dark' | 'light' | 'warm' }) {
  if (!reviews || reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

  const bgClass = variant === 'light'
    ? 'bg-gray-50'
    : variant === 'warm'
      ? 'bg-[#f5efe6]'
      : 'bg-black/20';
  const textClass = variant === 'light' ? 'text-gray-900' : variant === 'warm' ? 'text-[#2c1e16]' : 'text-white';
  const subTextClass = variant === 'light' ? 'text-gray-600' : variant === 'warm' ? 'text-[#5a4634]' : 'text-gray-400';
  const cardClass = variant === 'light'
    ? 'bg-white border border-gray-200 shadow-sm'
    : variant === 'warm'
      ? 'bg-[#fdfbf7] border border-[#e6d9c6]'
      : 'bg-white/5 border border-white/10';

  return (
    <section className={`${bgClass} py-16`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold ${textClass} mb-2`}>What Our Clients Say</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <StarRating rating={Math.round(avgRating)} />
            <span className={`text-sm ${subTextClass}`}>
              {avgRating.toFixed(1)} out of 5 ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review: any) => (
            <div key={review.id} className={`${cardClass} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <StarRating rating={review.rating} />
                <span className={`text-xs ${subTextClass}`}>
                  {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {review.comment && (
                <p className={`text-sm ${subTextClass} mb-3 line-clamp-3`}>&ldquo;{review.comment}&rdquo;</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-current/10">
                <span className={`text-sm font-semibold ${textClass}`}>
                  {review.user?.name || 'Anonymous'}
                </span>
                {review.appointment?.service?.name && (
                  <span className={`text-xs ${subTextClass}`}>{review.appointment.service.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed, reviews = [], dynamicTemplateHtml, dynamicTemplateCss }: any) {
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const pathname = usePathname() || '/';

    const handleBookClick = (service: any) => {
        setSelectedService(service);
    };

    // Click handler for dynamically generated templates where we can't easily attach React handlers to string HTML.
    const handleDynamicTemplateClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button') || target.closest('a');

        // Very basic heuristic: if it looks like a booking action, open the modal.
        if (button && (button.innerText.toLowerCase().includes('book') || button.innerText.toLowerCase().includes('appointment'))) {
            e.preventDefault();
            // Try to find a specific service based on data attribute, fallback to the first service
            const serviceId = button.getAttribute('data-service-id');
            const service = shop.services?.find((s: any) => s.id === serviceId) || shop.services?.[0];
            if (service) {
                setSelectedService(service);
            }
        }
    };

    // ── Normalised contact helpers (supports both old flat shape and new nested shape) ──
    const c = shop.customization || {};
    const pages = c.pages || [];
    const activePage = pages.find((p: any) => p.id === activePageId);
    const shopPhone   = c.contact?.phone   || c.phone   || '';
    const shopEmail   = c.contact?.email   || c.email   || '';
    const shopWebsite = c.contact?.website || c.website || '';
    const shopAddress = formatAddress(c.address);
    const shopFB      = c.contact?.facebook  || c.social?.facebook  || '';
    const shopIG      = c.contact?.instagram || c.social?.instagram || '';
    const shopTW      = c.contact?.twitter   || c.social?.twitter   || '';

    // Auth button for client sign-in/out
    const authButton = (
        <div className="absolute top-6 right-6 z-50">
            <SupabaseAuthButton redirectUrl={pathname} />
        </div>
    );

    if (dynamicTemplateHtml) {
        return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-slate-900 text-white font-sans relative" onClick={handleDynamicTemplateClick}>
                {authButton}
                {dynamicTemplateCss && <style dangerouslySetInnerHTML={{ __html: dynamicTemplateCss }} />}
                <div dangerouslySetInnerHTML={{ __html: dynamicTemplateHtml }} />
                
                {selectedService && (
                    <BookingModal
                        shopId={shop.id}
                        service={selectedService}
                        onClose={() => setSelectedService(null)}
                        shopHours={c.businessHours || {}}
                    />
                )}
            </main>
        );
    }

    if (templateType === 'sporty') {
        return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-white text-gray-900 font-sans relative">
                {/* Top Bar - Contact Info & Auth */}
                <div className="bg-black text-white text-xs py-2 px-4 flex justify-end items-center space-x-4">
                    {shopPhone && <span>{shopPhone}</span>}
                    {shopEmail && <span>{shopEmail}</span>}
                    <div className="relative">
                        <SupabaseAuthButton redirectUrl={pathname} />
                    </div>
                </div>
    
                {/* Header / Nav */}
                <header className="border-b-4 border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center overflow-x-auto hide-scrollbar">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter shrink-0 mr-6" style={{ color: sportRed }}>
                            {shop.name}
                        </h1>
                        {pages.filter((p: any) => p.isVisible).length > 0 && (
                            <nav className="flex gap-4 sm:gap-6 shrink-0">
                                <button onClick={() => setActivePageId(null)} className={`text-sm font-bold uppercase transition-colors ${!activePageId ? 'text-black' : 'text-gray-500 hover:text-black'}`}>Home</button>
                                {pages.filter((p: any) => p.isVisible).map((p: any) => (
                                    <button key={p.id} onClick={() => setActivePageId(p.id)} className={`text-sm font-bold uppercase transition-colors ${activePageId === p.id ? 'text-black' : 'text-gray-500 hover:text-black'}`}>{p.title}</button>
                                ))}
                            </nav>
                        )}
                    </div>
                </header>
    
                {activePage ? (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
                        <h1 className="text-4xl font-black uppercase italic mb-8" style={{ color: sportRed }}>{activePage.title}</h1>
                        <div className="prose prose-lg max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                    </section>
                ) : (
                    <>
                        {/* Hero Section */}
                <section className="bg-gray-100 border-b border-gray-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center md:text-left flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none mb-6">
                                The MVP <br/> Haircut <br/> Experience.
                            </h2>
                            <p className="text-xl text-gray-700 font-semibold mb-8 max-w-lg">
                                {shop.description || "Precision cuts, legendary service, and the ultimate environment."}
                            </p>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full max-w-md aspect-square bg-gray-300 transform -rotate-3 overflow-hidden shadow-2xl border-8 border-white">
                                 <div className="w-full h-full bg-black/10 flex items-center justify-center">
                                     <span className="text-6xl" style={{ color: sportRed }}>💈</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </section>
    
                {/* Services Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black uppercase italic mb-2">Our Services</h2>
                        <div className="w-24 h-2 mx-auto" style={{ backgroundColor: sportRed }}></div>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {shop.services?.map((service: any) => (
                            <div key={service.id} className="bg-white border-2 border-gray-200 p-8 text-center hover:border-black transition-colors shadow-sm hover:shadow-lg group flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic mb-4 group-hover:text-red-600 transition-colors" style={{ color: 'black' }}>
                                        {service.name}
                                    </h3>
                                    <div className="text-3xl font-bold mb-4" style={{ color: sportRed }}>
                                        ${service.price.toFixed(2)}
                                    </div>
                                    <p className="text-gray-600 mb-6 min-h-[3rem]">
                                        {service.description}
                                    </p>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-4 mb-4">
                                        Est. Time: {service.duration} mins
                                    </div>
                                    <button
                                        onClick={() => handleBookClick(service)}
                                        className="w-full text-white font-bold py-3 uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg"
                                        style={{ backgroundColor: sportRed }}
                                    >
                                        Book This
                                    </button>                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <ReviewsSection reviews={reviews} variant="light" />
                </>
                )}

                {/* Footer */}
                <footer className="bg-black text-white py-16 uppercase text-sm tracking-widest">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            <div className="md:col-span-2">
                                <h3 className="text-3xl font-black italic mb-6" style={{ color: sportRed }}>{shop.name}</h3>
                                <p className="text-gray-400 normal-case tracking-normal mb-6 max-w-sm">
                                    {shop.description}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 text-gray-300">Quick Links</h4>
                                <ul className="space-y-4 font-bold">
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Services</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 text-gray-300">Connect</h4>
                                <div className="flex flex-col space-y-4 font-bold">
                                    {shopFB && <a href={shopFB} className="hover:text-red-500 transition-colors">Facebook</a>}
                                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="hover:text-red-500 transition-colors">Instagram</a>}
                                    {shopTW && <a href={shopTW} className="hover:text-red-500 transition-colors">Twitter</a>}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 font-bold text-xs">
                            <p>&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                            {shopAddress && <p className="mt-4 md:mt-0">{shopAddress}</p>}
                        </div>
                    </div>
                </footer>

                {selectedService && (
                    <BookingModal 
                        shopId={shop.id} 
                        service={selectedService} 
                        onClose={() => setSelectedService(null)} 
                        shopHours={c.businessHours || {}}
                    />
                )}
            </main>
        );
      }
      
      if (templateType === 'corporate') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gray-100 text-gray-800 font-sans relative">
            <header className="bg-white shadow-md relative z-40">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4 overflow-x-auto hide-scrollbar">
                <h1 className="text-3xl font-bold shrink-0 mr-6" style={{ color: primaryColor }}>{shop.name}</h1>
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-4 sm:gap-6 shrink-0 mr-6">
                        <button onClick={() => setActivePageId(null)} className={`text-sm font-bold transition-colors ${!activePageId ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Home</button>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <button key={p.id} onClick={() => setActivePageId(p.id)} className={`text-sm font-bold transition-colors ${activePageId === p.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>{p.title}</button>
                        ))}
                    </nav>
                )}
                <div className="relative shrink-0">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
              </div>
            </header>

            {activePage ? (
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8" style={{ color: primaryColor }}>{activePage.title}</h1>
                    <div className="prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                </section>
            ) : (
                <>
            <section className="bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{shop.description || "Quality Service, Every Time."}</h2>
                    <p className="text-lg text-gray-600">Find your perfect look with our expert stylists.</p>
                </div>
            </section>
    
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {shop.services?.map((service: any) => (
                  <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow flex flex-col">
                    <div className="p-6 flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold" style={{ color: primaryColor }}>${service.price.toFixed(2)}</span>
                        <span className="text-sm text-gray-500">{service.duration} min</span>
                      </div>
                    </div>
                    <div className="px-6 pb-6 mt-auto">
                         <button
                            onClick={() => handleBookClick(service)}
                            className="w-full text-white font-bold py-2 rounded transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md"
                            style={{ backgroundColor: primaryColor }}
                         >
                            Book Service
                         </button>                    </div>
                  </div>
                ))}
              </div>
            </section>

            <ReviewsSection reviews={reviews} variant="light" />
            </>
            )}

            <footer className="bg-gray-800 text-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">{shop.name}</h3>
                    {shopAddress && <p className="text-gray-400">{shopAddress}</p>}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-4">Contact</h4>
                    {shopPhone && <p className="text-gray-400">{shopPhone}</p>}
                    {shopEmail && <p className="text-gray-400">{shopEmail}</p>}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-4">Follow Us</h4>
                    <div className="flex gap-4">
                      {shopFB && <a href={shopFB} className="text-gray-400 hover:text-white">Facebook</a>}
                      {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="text-gray-400 hover:text-white">Instagram</a>}
                      {shopTW && <a href={shopTW} className="text-gray-400 hover:text-white">Twitter</a>}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500 text-sm">
                  <p>&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                </div>
              </div>
            </footer>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={c.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'noir') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-black text-white font-serif relative">
            <div className="absolute top-6 left-8 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-6 font-sans text-xs uppercase tracking-[0.2em]">
                        <button onClick={() => setActivePageId(null)} className={`transition-colors ${!activePageId ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Home</button>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <button key={p.id} onClick={() => setActivePageId(p.id)} className={`transition-colors ${activePageId === p.id ? 'text-white' : 'text-gray-500 hover:text-white'}`}>{p.title}</button>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-8 z-50">
                <SupabaseAuthButton redirectUrl={pathname} />
            </div>
            
            <div className="p-8 md:p-16 pt-24 md:pt-32">
                {activePage ? (
                    <section className="max-w-3xl mx-auto min-h-[60vh]">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 text-center">{activePage.title}</h1>
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-sans" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                    </section>
                ) : (
                    <>
              <header className="text-center mb-16">
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter">{shop.name}</h1>
                <p className="text-lg text-gray-400 mt-2">{shop.description}</p>
              </header>
    
              <section className="max-w-3xl mx-auto">
                <h2 className="text-center text-sm uppercase tracking-[0.3em] text-gray-400 mb-10">Services</h2>
                <div className="space-y-6">
                  {shop.services?.map((service: any) => (
                    <div key={service.id} className="flex justify-between items-center border border-gray-800 p-4 hover:bg-gray-900 transition-colors">
                      <div>
                        <h3 className="text-xl font-bold">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.duration} minutes</p>
                      </div>
                      <div className="flex items-center gap-6">
                          <div className="text-xl font-bold">${service.price.toFixed(2)}</div>
                          <button
                            onClick={() => handleBookClick(service)}
                            className="border border-white text-white hover:bg-white hover:text-black px-4 py-1 uppercase text-xs tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                          >
                            Book
                          </button>                      </div>
                    </div>
                  ))}
                </div>
              </section>
              </>
              )}
            </div>

            <ReviewsSection reviews={reviews} variant="dark" />

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={c.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'sunset') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-purple-900 via-black to-orange-900 text-white font-sans relative">
            <div className="absolute w-full top-0 left-0 p-4 sm:p-6 flex justify-between items-center z-50">
             {pages.filter((p: any) => p.isVisible).length > 0 ? (
                 <nav className="flex gap-4 sm:gap-6 bg-black/30 px-4 sm:px-6 py-2 rounded-full backdrop-blur-md border border-orange-500/20 overflow-x-auto max-w-[calc(100vw-100px)] hide-scrollbar">
                    <button onClick={() => setActivePageId(null)} className={`text-sm font-medium transition-colors whitespace-nowrap ${!activePageId ? 'text-orange-400' : 'text-gray-400 hover:text-orange-400'}`}>Home</button>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <button key={p.id} onClick={() => setActivePageId(p.id)} className={`text-sm font-medium transition-colors whitespace-nowrap ${activePageId === p.id ? 'text-orange-400' : 'text-gray-400 hover:text-orange-400'}`}>{p.title}</button>
                    ))}
                 </nav>
             ) : (
                 <div />
             )}
             <SupabaseAuthButton redirectUrl={pathname} />
            </div>

            <div className="p-8 md:p-12 pt-24 md:pt-32">
              {activePage ? (
                <section className="max-w-4xl mx-auto min-h-[60vh]">
                    <div className="bg-black/30 backdrop-blur-sm border border-orange-500/30 rounded-lg p-8 md:p-12">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-8">{activePage.title}</h1>
                        <div className="prose prose-invert prose-lg max-w-none text-purple-200/80" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                    </div>
                </section>
              ) : (
                <>
              <header className="text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-4">{shop.name}</h1>
                <p className="text-lg text-purple-200/70">{shop.description}</p>
              </header>
    
              <section className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shop.services?.map((service: any) => (
                    <div key={service.id} className="bg-black/30 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 hover:border-orange-500 transition-colors flex flex-col">
                      <h3 className="text-2xl font-bold text-orange-300">{service.name}</h3>
                      <p className="text-purple-200/60 mt-1 mb-4 flex-grow">{service.description}</p>
                      <div className="flex justify-between items-center border-t border-orange-500/20 pt-4 mb-4">
                        <span className="text-sm text-gray-400">{service.duration} mins</span>
                        <span className="text-xl font-bold text-orange-400">${service.price.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleBookClick(service)}
                        className="w-full bg-gradient-to-r from-orange-500/20 to-purple-500/20 hover:from-orange-500 hover:to-purple-600 border border-orange-500/50 text-white font-semibold py-2 rounded transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                      >
                        Book
                      </button>                    </div>
                  ))}
                </div>
              </section>
              </>
              )}
            </div>

            <ReviewsSection reviews={reviews} variant="dark" />

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={c.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'minimal') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-white text-gray-900 font-sans relative">
            <div className="absolute top-6 left-6 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-4 sm:gap-6 font-semibold text-sm">
                        <button onClick={() => setActivePageId(null)} className={`transition-colors ${!activePageId ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}>Home</button>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <button key={p.id} onClick={() => setActivePageId(p.id)} className={`transition-colors ${activePageId === p.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}>{p.title}</button>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-6 z-50">
                <SupabaseAuthButton redirectUrl={pathname} />
            </div>

            {activePage ? (
                <section className="max-w-4xl mx-auto px-6 py-32 min-h-[60vh]">
                    <h1 className="text-4xl font-light tracking-tight mb-12" style={{ color: primaryColor }}>{activePage.title}</h1>
                    <div className="prose prose-lg max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                </section>
            ) : (
                <>
            <header className="max-w-4xl mx-auto px-6 pt-24 pb-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-end md:items-center">
              <div>
                <h1 className="text-4xl font-light tracking-tight" style={{ color: primaryColor }}>{shop.name}</h1>
                {shop.description && <p className="text-gray-500 mt-2">{shop.description}</p>}
              </div>
              <div className="text-right mt-6 md:mt-0 text-sm text-gray-500">
                 {shopPhone && <p>{shopPhone}</p>}
                 {shopAddress && <p>{shopAddress}</p>}
              </div>
            </header>
    
            <section className="max-w-4xl mx-auto px-6 py-16">
              <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-10">Service Menu</h2>
              {shop.services && shop.services.length > 0 ? (
                <div className="space-y-8">
                  {shop.services.map((service: any) => (
                    <div key={service.id} className="flex flex-col md:flex-row justify-between md:items-baseline group border-b border-gray-100 pb-4">
                      <div className="flex-1 mr-4 mb-4 md:mb-0">
                        <h3 className="text-lg font-medium transition-colors" style={{ color: primaryColor }}>{service.name}</h3>
                        {service.description && <p className="text-gray-500 text-sm mt-1">{service.description}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4 border-r border-gray-200 pr-4">
                            <span className="font-medium block">${service.price.toFixed(2)}</span>
                            <span className="text-gray-400 text-xs">{service.duration}m</span>
                        </div>
                        <button
                            onClick={() => handleBookClick(service)}
                            className="text-sm font-semibold hover:underline transition-all duration-300 hover:scale-110 active:scale-95 origin-right"
                            style={{ color: primaryColor }}
                        >
                            Book
                        </button>                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No services listed.</p>
              )}
            </section>
            </>
            )}

            <ReviewsSection reviews={reviews} variant="light" />

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={c.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'classic') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#fdfbf7] text-[#2c1e16] font-serif relative">
            <div className="absolute top-6 left-8 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-6 font-sans text-xs font-bold uppercase tracking-widest">
                        <button onClick={() => setActivePageId(null)} className={`transition-colors ${!activePageId ? 'text-[#2c1e16]' : 'text-[#8b7355] hover:text-[#2c1e16]'}`}>Home</button>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <button key={p.id} onClick={() => setActivePageId(p.id)} className={`transition-colors ${activePageId === p.id ? 'text-[#2c1e16]' : 'text-[#8b7355] hover:text-[#2c1e16]'}`}>{p.title}</button>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-8 z-50">
                <SupabaseAuthButton redirectUrl={pathname} />
            </div>

            {activePage ? (
                <section className="max-w-4xl mx-auto px-8 py-32 min-h-[60vh]">
                    <h1 className="text-5xl font-bold uppercase tracking-widest mb-12 text-center" style={{ color: primaryColor }}>{activePage.title}</h1>
                    <div className="prose prose-lg max-w-none text-[#5a4634]" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
                </section>
            ) : (
                <>
            <header className="border-b-4 border-[#2c1e16] pt-32 pb-16 text-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] relative">
              <h1 className="text-6xl font-bold uppercase tracking-widest mb-4" style={{ color: primaryColor }}>{shop.name}</h1>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="h-px w-16 bg-[#2c1e16]"></div>
                <span className="italic text-lg">Est. {new Date(shop.createdAt).getFullYear()}</span>
                <div className="h-px w-16 bg-[#2c1e16]"></div>
              </div>
              {shop.description && <p className="max-w-xl mx-auto text-[#5a4634]">{shop.description}</p>}
            </header>
    
            <section className="max-w-5xl mx-auto px-8 py-20">
              <h2 className="text-3xl font-bold text-center uppercase tracking-widest mb-16 relative">
                <span className="bg-[#fdfbf7] px-6 relative z-10">Our Services</span>
                <div className="absolute left-0 top-1/2 w-full h-px bg-[#e6d9c6] -z-0"></div>
              </h2>
    
              <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                {shop.services?.map((service: any) => (
                  <div key={service.id} className="text-center flex flex-col items-center">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>{service.name}</h3>
                    <div className="font-sans text-[#8b7355] text-sm tracking-widest uppercase mb-3">
                      ${service.price.toFixed(2)} &bull; {service.duration} MINS
                    </div>
                    {service.description && <p className="text-[#5a4634] italic text-sm mb-4">{service.description}</p>}
                    <button
                        onClick={() => handleBookClick(service)}
                        className="mt-auto border border-[#2c1e16] px-6 py-2 text-xs uppercase tracking-widest hover:bg-[#2c1e16] hover:text-[#fdfbf7] transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                    >
                        Select
                    </button>                  </div>
                ))}
              </div>
            </section>
            </>
            )}

            <ReviewsSection reviews={reviews} variant="warm" />

            <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-center text-sm font-sans tracking-widest uppercase">
                 {shopAddress && <p className="mb-2">{shopAddress}</p>}
                 {!shopAddress && <p className="mb-2">Visit us today</p>}
                 <p>{shopPhone}{shopPhone && shopEmail ? ' | ' : ''}{shopEmail}</p>
            </footer>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={c.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      // Default 'modern' template (the one that was originally there)
      return (
        <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          <header className="absolute w-full top-0 left-0 p-4 sm:p-6 flex justify-between items-center z-50">
             {pages.filter((p: any) => p.isVisible).length > 0 ? (
                 <nav className="flex gap-4 sm:gap-6 bg-black/20 px-4 sm:px-6 py-2 rounded-full backdrop-blur-md border border-white/10 overflow-x-auto max-w-[calc(100vw-100px)] hide-scrollbar">
                    <button onClick={() => setActivePageId(null)} className={`text-sm font-medium transition-colors whitespace-nowrap ${!activePageId ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Home</button>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <button key={p.id} onClick={() => setActivePageId(p.id)} className={`text-sm font-medium transition-colors whitespace-nowrap ${activePageId === p.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}>{p.title}</button>
                    ))}
                 </nav>
             ) : (
                 <div />
             )}
             <SupabaseAuthButton redirectUrl={pathname} />
          </header>

          {activePage ? (
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[80vh]">
               <div className="bg-slate-800/50 p-8 md:p-12 rounded-2xl border border-slate-700 shadow-xl">
                  <h1 className="text-4xl font-bold mb-8" style={{ color: primaryColor }}>{activePage.title}</h1>
                  <div className="prose prose-invert prose-lg max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: activePage.content || '' }} />
               </div>
            </section>
          ) : (
            <>
              {/* Hero Section */}
              <section 
                className="bg-black/40 backdrop-blur-md border-b border-slate-700 pt-16 md:pt-8"
                style={{ borderBottomColor: primaryColor }}
              >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
              <div className="text-center">
                <h1 
                  className="text-5xl md:text-6xl font-bold mb-6"
                  style={{ color: primaryColor }}
                >
                  {shop.name}
                </h1>
                {shop.description && (
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    {shop.description}
                  </p>
                )}
              </div>
            </div>
          </section>
    
          {/* Services Section */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Our Services</h2>
              <div 
                className="w-20 h-1 rounded-full"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
              ></div>
            </div>
    
            {shop.services && shop.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shop.services.map((service: any) => (
                  <div
                    key={service.id}
                    className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 transition-all duration-300 hover:shadow-lg flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white transition-colors">
                        {service.name}
                      </h3>
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        ${service.price.toFixed(2)}
                      </div>
                    </div>
    
                    {service.description && (
                      <p className="text-gray-400 mb-4 text-sm leading-relaxed flex-grow">
                        {service.description}
                      </p>
                    )}
    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700 mt-auto">
                      <div className="text-gray-500 text-sm">
                        ⏱️ {service.duration} minutes
                      </div>
                      <button
                        onClick={() => handleBookClick(service)}
                        className="text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book
                      </button>                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">
                  No services available at the moment. Please check back later.
                </p>
              </div>
            )}
          </section>

          <ReviewsSection reviews={reviews} variant="dark" />
            </>
          )}

          {/* Footer */}
          <footer className="bg-black/50 border-t border-slate-700 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-white font-bold text-lg mb-4">{shop.name}</h3>
                  <p className="text-gray-400 mb-4">
                    {shop.description || 'Your trusted service provider'}
                  </p>
                  {shopAddress && (
                    <p className="text-gray-400 text-sm">{shopAddress}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Contact</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    {shopPhone && (
                      <li>
                        <a href={`tel:${shopPhone}`} className="hover:text-white transition">
                          📞 {shopPhone}
                        </a>
                      </li>
                    )}
                    {shopEmail && (
                      <li>
                        <a href={`mailto:${shopEmail}`} className="hover:text-white transition">
                          ✉️ {shopEmail}
                        </a>
                      </li>
                    )}
                    {shopWebsite && (
                      <li>
                        <a href={shopWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                          🌐 Website
                        </a>
                      </li>
                    )}
                    <li>
                      <a href="#services" className="hover:text-white transition">
                        Services
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Follow Us</h4>
                  <div className="flex gap-4">
                    {shopFB && (
                      <a
                        href={shopFB}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition"
                      >
                        Facebook
                      </a>
                    )}
                    {shopIG && (
                      <a
                        href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition"
                      >
                        Instagram
                      </a>
                    )}
                    {shopTW && (
                      <a
                        href={shopTW}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-8 text-center text-gray-500 text-sm">
                <p>
                  &copy; {new Date().getFullYear()} {shop.name}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {selectedService && (
            <BookingModal 
                shopId={shop.id} 
                service={selectedService} 
                onClose={() => setSelectedService(null)} 
                shopHours={c.businessHours || {}}
            />
          )}
        </main>
      );
}
