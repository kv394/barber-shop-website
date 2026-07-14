import React from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Phone, Users, Clock, ArrowRight, Star, Heart, Mail } from 'lucide-react';
import { fmtPrice } from '@/lib/formatters';

export default function StudioTemplate({ ctx }: { ctx: any }) {
  const { 
    shop, primaryColor, secondaryColor, handleBookClick
  } = ctx;
  const { customization, services = [], staff = [], reviews = [], classSchedules = [] } = shop;
  const address = typeof customization?.address === 'object' 
    ? `${customization.address.street || ''}, ${customization.address.city || ''}`
    : customization?.address;

  // Build class display list: prefer classSchedules (has day/time/instructor info),
  // fall back to services filtered by type
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Deduplicate classSchedules by serviceId to get unique class types
  const uniqueClassMap = new Map<string, any>();
  (classSchedules || []).forEach((cs: any) => {
    if (cs.service && !uniqueClassMap.has(cs.service.id)) {
      uniqueClassMap.set(cs.service.id, {
        ...cs.service,
        // Collect all schedule times for display
        schedules: (classSchedules || [])
          .filter((s: any) => s.service?.id === cs.service.id)
          .map((s: any) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, staff: s.staff })),
        availableSpots: cs.availableSpots,
        enrolledCount: cs.enrolledCount,
      });
    }
  });

  // Use classSchedules-derived list if available, otherwise fall back to services
  const customerServices = uniqueClassMap.size > 0
    ? Array.from(uniqueClassMap.values())
    : services.filter((s: any) => s.type === 'CUSTOMER' && s.isBookable !== false);

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

      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 md:px-12 flex justify-between items-center studio-glass border-b border-white/5 transition-all">
        <div className="flex items-center gap-3">
          {shop.logoUrl && (
            <Image src={shop.logoUrl} alt={shop.name} width={48} height={48} className="rounded-xl" />
          )}
          <h1 className="text-2xl font-black tracking-tight text-white hidden sm:block">{shop.name}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-neutral-400">
            <a href="#classes" className="text-sm font-medium hover:text-white transition-colors">Programs</a>
            <a href="#faculty" className="text-sm font-medium hover:text-white transition-colors">Faculty</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-white transition-colors">Testimonials</a>
          </div>
          <button 
            onClick={() => ctx.handleBookClick()}
            style={{ backgroundColor: primaryColor }}
            className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-[0_0_20px_rgba(var(--studio-primary),0.3)] hover:scale-105 transition-transform"
          >
            Client Portal
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl px-6">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 studio-gradient-text leading-tight drop-shadow-2xl">
            {customization?.heroTitle || 'Discover the Dancer in You.'}
          </h2>
          <p className="text-lg md:text-2xl text-neutral-200 mb-10 max-w-3xl mx-auto font-light drop-shadow-md">
            {shop.description || 'Join our studio and experience world-class training in a supportive community environment.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => ctx.handleBookClick()}
              style={{ backgroundColor: primaryColor }}
              className="w-full sm:w-auto px-10 py-5 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(var(--studio-primary),0.4)]"
            >
              View Schedule & Register <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#classes"
              className="w-full sm:w-auto px-10 py-5 rounded-full text-white text-lg font-bold studio-glass hover:bg-white/10 transition-colors border border-white/20 flex items-center justify-center"
            >
              Explore Programs
            </a>
          </div>
          
          {/* Social Icons Hero */}
          <div className="mt-16 flex items-center justify-center gap-6">
            <a href="#" className="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">
              IG
            </a>
            <a href="#" className="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">
              FB
            </a>
            <a href="#" className="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">
              YT
            </a>
          </div>
        </div>
      </div>

      {/* Features / Why Us */}
      <section className="py-24 border-b border-white/5 bg-neutral-900/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style={{ color: primaryColor }}>
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Expert Faculty</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">Train with industry professionals who are passionate about nurturing talent.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style={{ color: primaryColor }}>
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Flexible Schedules</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">Multiple class times per week to fit your busy family schedule.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style={{ color: primaryColor }}>
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Premium Studios</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">State-of-the-art flooring, mirrors, and sound systems for the best experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Classes / Programs Section */}
      <section id="classes" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: primaryColor }}>Our Curriculum</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white">Programs & Classes</h3>
          </div>
          <button 
            onClick={() => handleBookClick(null)}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-medium text-lg border-b border-transparent hover:border-white pb-1"
          >
            See Full Schedule <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {customerServices.map((service: any) => (
            <div 
              key={service.id}
              onClick={() => handleBookClick(service)}
              className="studio-glass rounded-3xl p-8 studio-card-hover cursor-pointer group flex flex-col h-full relative overflow-hidden border border-white/10"
            >
              {/* Decorative accent */}
              <div 
                className="absolute top-0 right-0 w-48 h-48 opacity-10 group-hover:opacity-30 transition-opacity blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex-1 relative z-10">
                <h4 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-all">
                  {service.name}
                </h4>
                {service.description && (
                  <p className="text-neutral-400 text-base leading-relaxed mb-4 line-clamp-4">
                    {service.description}
                  </p>
                )}

                {/* Schedule times from classSchedules */}
                {service.schedules && service.schedules.length > 0 && (
                  <div className="mb-6 space-y-1.5">
                    {service.schedules.slice(0, 3).map((sched: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-neutral-300">
                        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
                        <span>{DAY_NAMES[sched.dayOfWeek]} {sched.startTime}–{sched.endTime}</span>
                        {sched.staff?.name && <span className="text-neutral-500">· {sched.staff.name}</span>}
                      </div>
                    ))}
                    {service.schedules.length > 3 && (
                      <span className="text-xs text-neutral-500">+{service.schedules.length - 3} more times</span>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300 font-medium">
                  <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                    {service.duration} min
                  </div>
                  {service.maxCapacity && (
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                      <Users className="w-4 h-4" style={{ color: primaryColor }} />
                      Max {service.maxCapacity}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  {service.semesterPrice ? (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Semester Tuition</span>
                      <span className="text-2xl font-black text-white">{fmtPrice(service.semesterPrice, shop.currency)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Drop-in Rate</span>
                      <span className="text-2xl font-black text-white">{fmtPrice(service.dropInPrice || service.price, shop.currency)}</span>
                    </>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full studio-glass flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors border border-white/10">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructors / Faculty Section */}
      {staff && staff.length > 0 && (
        <section id="faculty" className="py-32 border-t border-b border-white/5 bg-neutral-900/50">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: primaryColor }}>Meet the Team</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white">Our Faculty</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {staff.map((member: any) => (
                <div key={member.id} className="group relative rounded-3xl overflow-hidden studio-glass border border-white/5">
                  <div className="aspect-[3/4] relative w-full bg-neutral-800">
                    {member.imageUrl ? (
                      <Image 
                        src={member.imageUrl} 
                        alt={member.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                        <Users className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-80" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h4 className="text-2xl font-bold text-white mb-1">{member.name}</h4>
                    <p className="text-neutral-300 font-medium" style={{ color: primaryColor }}>{member.role || 'Instructor'}</p>
                    {member.bio && (
                      <p className="text-sm text-neutral-400 mt-3 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Additional Services / Studio Rental */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative">
        <div className="studio-glass rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950 opacity-90" />
            <div 
              className="absolute -top-40 -right-40 w-96 h-96 opacity-20 blur-[100px] rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">More Than Just Classes</h3>
              <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
                Looking for rehearsal space, private event choreography, or the perfect gift for a dancer? We offer studio rentals and gift cards to support our vibrant community.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-3 rounded-full text-white font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
                  Studio Rental
                </button>
                <button className="px-8 py-3 rounded-full text-white font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
                  Buy Gift Card
                </button>
              </div>
            </div>
            
            <div className="flex-shrink-0 grid grid-cols-2 gap-4">
               <div className="w-32 h-32 rounded-2xl studio-glass flex items-center justify-center flex-col gap-3">
                 <Heart className="w-8 h-8" style={{ color: primaryColor }} />
                 <span className="text-sm font-bold text-white">Weddings</span>
               </div>
               <div className="w-32 h-32 rounded-2xl studio-glass flex items-center justify-center flex-col gap-3 translate-y-8">
                 <Star className="w-8 h-8" style={{ color: primaryColor }} />
                 <span className="text-sm font-bold text-white">Events</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews && reviews.length > 0 && (
        <section id="testimonials" className="py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: primaryColor }}>Community</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white">What Dancers Say</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="studio-glass rounded-3xl p-8 border border-white/5 relative">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" style={{ color: primaryColor }} />
                    ))}
                  </div>
                  <p className="text-neutral-300 text-lg leading-relaxed mb-8">
                    "{review.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold" style={{ color: primaryColor }}>
                      {review.authorName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-white">{review.authorName}</h5>
                      <span className="text-sm text-neutral-500">Student</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer / Contact */}
      <footer className="bg-neutral-950 py-20 border-t border-white/10 relative overflow-hidden">
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 blur-[120px] rounded-[100%]"
          style={{ backgroundColor: primaryColor }}
        />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              {shop.logoUrl && <Image src={shop.logoUrl} alt={shop.name} width={48} height={48} className="rounded-xl" />}
              <h2 className="text-3xl font-black tracking-tight text-white">{shop.name}</h2>
            </div>
            <p className="text-neutral-400 mb-8 max-w-sm text-lg leading-relaxed">
              Inspiring the next generation of artists. Join our family today and discover your true potential.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-xs font-bold">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-xs font-bold">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="text-lg font-bold text-white mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><a href="#classes" className="text-neutral-400 hover:text-white transition-colors">Programs & Classes</a></li>
              <li><a href="#faculty" className="text-neutral-400 hover:text-white transition-colors">Faculty</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Studio Rental</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Class Policies</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-4">
            <h4 className="text-lg font-bold text-white mb-6">Contact Us</h4>
            <div className="space-y-6">
              {address && (
                <div className="flex items-start gap-4 text-neutral-300">
                  <MapPin className="w-6 h-6 shrink-0 mt-1" style={{ color: primaryColor }} />
                  <span className="text-lg">{address}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-4 text-neutral-300">
                  <Phone className="w-6 h-6 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-lg">{shop.phone}</span>
                </div>
              )}
              <div className="pt-6">
                <button 
                  onClick={() => handleBookClick(null)}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full px-8 py-4 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
                >
                  Register Now <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-20 pt-8 border-t border-white/10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 text-neutral-500 text-sm">
          <p>© {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
