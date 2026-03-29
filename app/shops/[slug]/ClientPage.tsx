'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

// Lazy-load the BookingModal component
const BookingModal = dynamic(() => import('@/components/BookingModal'), {
    ssr: false, // This component will only be rendered on the client side
    loading: () => <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center"><p className="text-white">Loading...</p></div>
});

export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed }: any) {
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, [pathname]);

    const handleBookClick = (service: any) => {
        setSelectedService(service);
    };

    const handleSignInClick = () => {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
    };

    const authButton = (
        <div className="absolute top-6 right-6 z-50">
            {isSignedIn ? (
                <UserButton afterSignOutUrl={currentPath} />
            ) : (
                <button 
                   onClick={handleSignInClick}
                   className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                   Sign In
                </button>
            )}
        </div>
    );

    if (templateType === 'sporty') {
        return (
            <main className="min-h-screen bg-white text-gray-900 font-sans relative">
                {/* Top Bar - Contact Info & Auth */}
                <div className="bg-black text-white text-xs py-2 px-4 flex justify-end items-center space-x-4">
                    {shop.customization?.phone && <span>{shop.customization.phone}</span>}
                    {shop.customization?.email && <span>{shop.customization.email}</span>}
                    <div className="relative">
                        {isSignedIn ? (
                            <UserButton afterSignOutUrl={currentPath} />
                        ) : (
                            <button onClick={handleSignInClick} className="text-white hover:underline">Sign In</button>
                        )}
                    </div>
                </div>
    
                {/* Header / Nav */}
                <header className="border-b-4 border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter" style={{ color: sportRed }}>
                            {shop.name}
                        </h1>
                    </div>
                </header>
    
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
                                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 uppercase tracking-wider transition-colors" 
                                        style={{ backgroundColor: sportRed }}
                                    >
                                        Book This
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
    
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
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Find a Location</a></li>
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Services</a></li>
                                    <li><a href="#" className="hover:text-red-500 transition-colors">Careers</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 text-gray-300">Connect</h4>
                                <div className="flex flex-col space-y-4 font-bold">
                                    {shop.customization?.social?.facebook && <a href={shop.customization.social.facebook} className="hover:text-red-500 transition-colors">Facebook</a>}
                                    {shop.customization?.social?.instagram && <a href={shop.customization.social.instagram} className="hover:text-red-500 transition-colors">Instagram</a>}
                                    {shop.customization?.social?.twitter && <a href={shop.customization.social.twitter} className="hover:text-red-500 transition-colors">Twitter</a>}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 font-bold text-xs">
                            <p>&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                            <p className="mt-4 md:mt-0">{shop.customization?.address}</p>
                        </div>
                    </div>
                </footer>

                {selectedService && (
                    <BookingModal 
                        shopId={shop.id} 
                        service={selectedService} 
                        onClose={() => setSelectedService(null)} 
                        shopHours={shop.customization?.businessHours || {}}
                    />
                )}
            </main>
        );
      }
      
      if (templateType === 'corporate') {
        return (
          <main className="min-h-screen bg-gray-100 text-gray-800 font-sans relative">
            <header className="bg-white shadow-md relative z-40">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
                <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>
                <div className="relative">
                    {isSignedIn ? (
                        <UserButton afterSignOutUrl={currentPath} />
                    ) : (
                        <button onClick={handleSignInClick} className="text-gray-600 hover:underline">Sign In</button>
                    )}
                </div>
              </div>
            </header>
    
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
                            className="w-full text-white font-bold py-2 rounded transition-opacity hover:opacity-90" 
                            style={{ backgroundColor: primaryColor }}
                        >
                            Book Service
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
    
            <footer className="bg-gray-800 text-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">{shop.name}</h3>
                    <p className="text-gray-400">{shop.customization?.address}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-4">Contact</h4>
                    <p className="text-gray-400">{shop.customization?.phone}</p>
                    <p className="text-gray-400">{shop.customization?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-4">Follow Us</h4>
                    <div className="flex gap-4">
                      {shop.customization?.social?.facebook && <a href={shop.customization.social.facebook} className="text-gray-400 hover:text-white">Facebook</a>}
                      {shop.customization?.social?.instagram && <a href={shop.customization.social.instagram} className="text-gray-400 hover:text-white">Instagram</a>}
                      {shop.customization?.social?.twitter && <a href={shop.customization.social.twitter} className="text-gray-400 hover:text-white">Twitter</a>}
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
                    shopHours={shop.customization?.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'noir') {
        return (
          <main className="min-h-screen bg-black text-white font-serif relative">
            {authButton}
            <div className="p-8 md:p-16">
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
                            className="border border-white text-white hover:bg-white hover:text-black px-4 py-1 uppercase text-xs tracking-widest transition-colors"
                          >
                            Book
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={shop.customization?.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'sunset') {
        return (
          <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 text-white font-sans relative">
            {authButton}
            <div className="p-8 md:p-12">
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
                        className="w-full bg-gradient-to-r from-orange-500/20 to-purple-500/20 hover:from-orange-500 hover:to-purple-600 border border-orange-500/50 text-white font-semibold py-2 rounded transition-all"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={shop.customization?.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'minimal') {
        return (
          <main className="min-h-screen bg-white text-gray-900 font-sans relative">
            <div className="absolute top-6 right-6 z-50">
                {isSignedIn ? (
                    <UserButton afterSignOutUrl={currentPath} />
                ) : (
                    <button onClick={handleSignInClick} className="text-gray-600 hover:underline">Sign In</button>
                )}
            </div>
            <header className="max-w-4xl mx-auto px-6 py-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-end md:items-center">
              <div>
                <h1 className="text-4xl font-light tracking-tight" style={{ color: primaryColor }}>{shop.name}</h1>
                {shop.description && <p className="text-gray-500 mt-2">{shop.description}</p>}
              </div>
              <div className="text-right mt-6 md:mt-0 text-sm text-gray-500">
                 {shop.customization?.phone && <p>{shop.customization.phone}</p>}
                 {shop.customization?.address && <p>{shop.customization.address}</p>}
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
                            className="text-sm font-semibold hover:underline" 
                            style={{ color: primaryColor }}
                        >
                            Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No services listed.</p>
              )}
            </section>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={shop.customization?.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      if (templateType === 'classic') {
        return (
          <main className="min-h-screen bg-[#fdfbf7] text-[#2c1e16] font-serif relative">
            <div className="absolute top-6 right-8 z-50">
                {isSignedIn ? (
                    <UserButton afterSignOutUrl={currentPath} />
                ) : (
                    <button onClick={handleSignInClick} className="text-gray-600 hover:underline">Sign In</button>
                )}
            </div>
            <header className="border-b-4 border-[#2c1e16] py-16 text-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] relative">
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
                        className="mt-auto border border-[#2c1e16] px-6 py-2 text-xs uppercase tracking-widest hover:bg-[#2c1e16] hover:text-[#fdfbf7] transition-colors"
                    >
                        Select
                    </button>
                  </div>
                ))}
              </div>
            </section>
            
            <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-center text-sm font-sans tracking-widest uppercase">
                 <p className="mb-2">{shop.customization?.address || 'Visit us today'}</p>
                 <p>{shop.customization?.phone} | {shop.customization?.email}</p>
            </footer>

            {selectedService && (
                <BookingModal 
                    shopId={shop.id} 
                    service={selectedService} 
                    onClose={() => setSelectedService(null)} 
                    shopHours={shop.customization?.businessHours || {}}
                />
            )}
          </main>
        );
      }
    
      // Default 'modern' template (the one that was originally there)
      return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          <header className="absolute w-full top-0 left-0 p-6 flex justify-end z-50">
             {isSignedIn ? (
                 <UserButton afterSignOutUrl={currentPath} />
             ) : (
                 <button 
                    onClick={handleSignInClick}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                 >
                    Sign In
                 </button>
             )}
          </header>
          {/* Hero Section */}
          <section 
            className="bg-black/40 backdrop-blur-md border-b border-slate-700"
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
                        className="text-white px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90 text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book
                      </button>
                    </div>
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
    
          {/* Footer */}
          <footer className="bg-black/50 border-t border-slate-700 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-white font-bold text-lg mb-4">{shop.name}</h3>
                  <p className="text-gray-400 mb-4">
                    {shop.description || 'Your trusted service provider'}
                  </p>
                  {shop.customization?.address && (
                    <p className="text-gray-400 text-sm">{shop.customization.address}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold mb-4">Contact</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    {shop.customization?.phone && (
                      <li>
                        <a href={`tel:${shop.customization.phone}`} className="hover:text-white transition">
                          📞 {shop.customization.phone}
                        </a>
                      </li>
                    )}
                    {shop.customization?.email && (
                      <li>
                        <a href={`mailto:${shop.customization.email}`} className="hover:text-white transition">
                          ✉️ {shop.customization.email}
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
                    {shop.customization?.social?.facebook && (
                      <a
                        href={shop.customization.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition"
                      >
                        Facebook
                      </a>
                    )}
                    {shop.customization?.social?.instagram && (
                      <a
                        href={shop.customization.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition"
                      >
                        Instagram
                      </a>
                    )}
                    {shop.customization?.social?.twitter && (
                      <a
                        href={shop.customization.social.twitter}
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
                shopHours={shop.customization?.businessHours || {}}
            />
          )}
        </main>
      );
}
