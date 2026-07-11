import React from 'react';
import Image from 'next/image';
import { ShoppingBag, Calendar, MapPin, Phone, Users, Clock, ArrowRight } from 'lucide-react';
import { fmtPrice } from '@/lib/formatters';

export default function StudioTemplate({ ctx }: { ctx: any }) {
  const { 
    shop, primaryColor, secondaryColor, handleBookClick
  } = ctx;
  const { customization, services = [], staff = [], reviews = [] } = shop;
  const address = typeof customization?.address === 'object' 
    ? `${customization.address.street || ''}, ${customization.address.city || ''}`
    : customization?.address;

  // Filter services to only show ones available to customers
  const customerServices = services.filter((s: any) => s.type === 'CUSTOMER' && s.isBookable !== false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-white/20">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --studio-primary: ${primaryColor};
          --studio-secondary: ${secondaryColor};
        }
        .studio-gradient-text {
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .studio-glass {
          background: rgba(25, 25, 25, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .studio-card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .studio-card-hover:hover {
          transform: translateY(-5px);
          background: rgba(35, 35, 35, 0.8);
          border-color: var(--studio-primary);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
        }
      `}} />

      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          {shop.heroImageUrl ? (
            <Image 
              src={shop.heroImageUrl} 
              alt="Studio" 
              fill 
              className="object-cover opacity-60 scale-105 animate-[pulse_20s_ease-in-out_infinite]"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950 opacity-80" />
        </div>

        {/* Header / Nav */}
        <header className="absolute top-0 left-0 right-0 z-50 p-6 md:px-12 flex justify-between items-center studio-glass border-b-0 border-white/5">
          <div className="flex items-center gap-3">
            {shop.logoUrl && (
              <Image src={shop.logoUrl} alt={shop.name} width={48} height={48} className="rounded-xl" />
            )}
            <h1 className="text-2xl font-black tracking-tight text-white">{shop.name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <a href="#classes" className="hidden md:block text-sm font-medium text-neutral-300 hover:text-white transition-colors">Programs</a>
            <a href="#instructors" className="hidden md:block text-sm font-medium text-neutral-300 hover:text-white transition-colors">Instructors</a>
            <button 
              onClick={() => onBook()}
              style={{ backgroundColor: primaryColor }}
              className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-[0_0_20px_rgba(var(--studio-primary),0.3)] hover:scale-105 transition-transform"
            >
              Client Portal
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl px-6 pt-20">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 studio-gradient-text leading-tight">
            {customization?.heroTitle || 'Discover the Dancer in You.'}
          </h2>
          <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto font-light">
            {shop.description || 'Join our studio and experience world-class training in a supportive community environment.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => onBook()}
              style={{ backgroundColor: primaryColor }}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              View Schedule & Register <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#classes"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-white text-lg font-bold studio-glass hover:bg-white/10 transition-colors border border-white/20 flex items-center justify-center"
            >
              Explore Programs
            </a>
          </div>
        </div>
      </div>

      {/* Classes / Programs Section */}
      <section id="classes" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: primaryColor }}>Our Curriculum</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight text-white">Programs & Classes</h3>
          </div>
          <button 
            onClick={() => handleBookClick(null)}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
          >
            See Full Schedule <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerServices.map((service: any) => (
            <div 
              key={service.id}
              onClick={() => handleBookClick(service)}
              className="studio-glass rounded-3xl p-8 studio-card-hover cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-20 group-hover:opacity-40 transition-opacity blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex-1 relative z-10">
                <h4 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-all">
                  {service.name}
                </h4>
                {service.description && (
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-3">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-neutral-300 font-medium">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                    {service.duration} min
                  </div>
                  {service.maxCapacity && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                      <Users className="w-4 h-4" style={{ color: primaryColor }} />
                      Max {service.maxCapacity}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  {service.semesterPrice ? (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Semester Tuition</span>
                      <span className="text-xl font-black text-white">{fmtPrice(service.semesterPrice, shop.currency)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Drop-in Rate</span>
                      <span className="text-xl font-black text-white">{fmtPrice(service.dropInPrice || service.price, shop.currency)}</span>
                    </>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full studio-glass flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features / Why Us */}
      <section className="py-24 border-t border-b border-white/5 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg" style={{ color: primaryColor }}>
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Expert Faculty</h3>
              <p className="text-neutral-400">Train with industry professionals who are passionate about nurturing talent.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg" style={{ color: primaryColor }}>
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Flexible Schedules</h3>
              <p className="text-neutral-400">Multiple class times per week to fit your busy family schedule.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg" style={{ color: primaryColor }}>
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Premium Studios</h3>
              <p className="text-neutral-400">State-of-the-art flooring, mirrors, and sound systems for the best experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="bg-neutral-950 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              {shop.logoUrl && <Image src={shop.logoUrl} alt={shop.name} width={40} height={40} className="rounded-lg" />}
              <h2 className="text-2xl font-black tracking-tight text-white">{shop.name}</h2>
            </div>
            <p className="text-neutral-400 mb-8 max-w-sm">
              Inspiring the next generation of artists. Join our family today.
            </p>
            <div className="space-y-4">
              {address && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <MapPin className="w-5 h-5 text-neutral-500" />
                  <span>{address}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <Phone className="w-5 h-5 text-neutral-500" />
                  <span>{shop.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:text-right flex flex-col md:items-end justify-center">
            <h3 className="text-3xl font-black text-white mb-6">Ready to move?</h3>
            <button 
              onClick={() => handleBookClick(null)}
              style={{ backgroundColor: primaryColor }}
              className="px-8 py-4 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(var(--studio-primary),0.2)]"
            >
              Sign Up for a Class <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
