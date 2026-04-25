'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import { usePathname } from 'next/navigation';
import InteractiveReviewsSection from '@/components/reviews/InteractiveReviewsSection';


// Lazy-load the BookingModal component
const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
    ssr: false, // This component will only be rendered on the client side
    loading: () => <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center"><p className="text-crm-text text-[13px]">Loading...</p></div>
});

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50"><p className="text-gray-500">Loading booking portal...</p></div>
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
    ? 'bg-crm-bg'
    : variant === 'warm'
      ? 'bg-[#f5efe6]'
      : 'bg-crm-surface';
  const textClass = variant === 'light' ? 'text-crm-text' : variant === 'warm' ? 'text-[#2c1e16]' : 'text-crm-text';
  const subTextClass = variant === 'light' ? 'text-crm-muted' : variant === 'warm' ? 'text-[#5a4634]' : 'text-crm-muted';
  const cardClass = variant === 'light'
    ? 'bg-crm-surface border border-crm-border shadow-sm shadow-sm'
    : variant === 'warm'
      ? 'bg-[#fdfbf7] border border-[#e6d9c6]'
      : 'bg-crm-surface border border-crm-border shadow-sm';

  return (
    <section className={`${bgClass} py-16`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`${` font-bold ${textClass} text-xl font-bold`} mb-2`}>What Our Clients Say</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <StarRating rating={Math.round(avgRating)} />
            <span className={`text-[13px] ${subTextClass}`}>
              {avgRating.toFixed(1)} out of 5 ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review: any) => (
            <div key={review.id} className={`${cardClass} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <StarRating rating={review.rating} />
                <span className={`text-[11px] ${subTextClass}`}>
                  {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {review.comment && (
                <p className={`${` ${subTextClass} text-[13px]`} mb-3 line-clamp-3`}>&ldquo;{review.comment}&rdquo;</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-current/10">
                <span className={`text-[13px] font-semibold ${textClass}`}>
                  {review.user?.name || 'Anonymous'}
                </span>
                {review.appointment?.service?.name && (
                  <span className={`text-[11px] ${subTextClass}`}>{review.appointment.service.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomPageContent({ content, shop, themeColor, className, onBookClick, reviews = [], templateType = 'modern' }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void, reviews?: any[], templateType?: string }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  if (!content) return null;
  const parts = content.split(/(\$\{products\}|\$\{services\}|\$\{reviews\}|\$\{team\}|\$\{gallery\}|\$\{contact\})/gi);
  if (parts.length === 1) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const sellableProducts = shop.products?.filter((product: any) => product.isSellable !== false) || [];
  const services = shop.services || [];
  const staffMembers = shop.users || [];
  const galleryImages = shop.portfolioImages || [];
  const ctaText = shop.customization?.ctaText || 'Book';

  const getThemeStyles = () => {
    switch (templateType) {
      case 'sporty':
        return {
          card: 'bg-crm-surface border-2 border-crm-border p-6 text-center shadow-sm',
          title: 'font-black uppercase italic text-lg',
          price: 'text-2xl font-bold mb-4',
          desc: 'text-crm-muted mb-6 min-h-[3rem] text-[13px]',
          btn: 'w-full text-white font-bold py-3 uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md',
          btnStyle: { backgroundColor: themeColor || '#ef4444' }
        };
      case 'corporate':
        return {
          card: 'bg-white rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col',
          title: 'font-bold text-gray-900 mb-2 text-lg',
          price: 'text-lg font-bold text-blue-600',
          desc: 'text-gray-500 mb-4 text-[13px] flex-grow',
          btn: 'w-full text-white font-bold py-2 rounded transition-all hover:opacity-90 shadow-sm mt-4',
          btnStyle: { backgroundColor: themeColor || '#2563eb' }
        };
      case 'noir':
        return {
          card: 'bg-transparent border border-gray-800 p-6 hover:bg-gray-900/50 transition-colors flex flex-col text-center',
          title: 'font-bold uppercase tracking-widest text-lg mb-2',
          price: 'text-lg font-bold mb-4',
          desc: 'text-gray-400 mb-6 text-[13px] flex-grow',
          btn: 'w-full bg-white text-black font-bold uppercase py-3 tracking-[0.2em] hover:bg-gray-200 transition-colors',
          btnStyle: { color: 'black' }
        };
      case 'sunset':
        return {
          card: 'bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 text-white shadow-xl flex flex-col hover:border-orange-500/50 transition-colors',
          title: 'font-bold text-lg text-orange-400 mb-2',
          price: 'text-xl font-bold text-orange-400',
          desc: 'text-white/60 mb-4 text-[13px] flex-grow',
          btn: 'w-full bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold py-2 rounded transition-all hover:opacity-90 mt-4',
          btnStyle: {}
        };
      case 'editorial':
        return {
          card: 'bg-[#0d0f0d] p-8 rounded-2xl flex flex-col border border-[#292a29]',
          title: 'font-serif text-[#e3e2e0] text-xl mb-4',
          price: 'text-[13px] font-bold text-white mb-4',
          desc: 'text-[#d0c5af] leading-relaxed text-[13px] mb-6 flex-grow',
          btn: 'font-semibold flex items-center justify-center gap-2 uppercase tracking-widest py-3 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors',
          btnStyle: themeColor ? { borderColor: themeColor, color: themeColor } : {}
        };
      case 'minimal':
        return {
          card: 'bg-transparent border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between md:items-center',
          title: 'font-medium text-lg text-gray-900',
          price: 'font-medium text-gray-900',
          desc: 'text-gray-500 mt-1 text-[13px]',
          btn: 'text-[13px] font-semibold hover:underline mt-4 md:mt-0',
          btnStyle: { color: themeColor || '#000' }
        };
      case 'classic':
        return {
          card: 'bg-[#fdfbf7] border border-[#e6d9c6] p-8 text-center flex flex-col items-center shadow-sm',
          title: 'font-bold mb-2 text-lg text-[#2c1e16]',
          price: 'text-[#8b7355] text-[13px] tracking-widest uppercase mb-3 font-semibold',
          desc: 'text-[#5a4634] italic mb-6 text-[13px] flex-grow',
          btn: 'mt-auto border border-[#2c1e16] px-6 py-2 text-[11px] uppercase tracking-widest text-[#2c1e16] hover:bg-[#2c1e16] hover:text-[#fdfbf7] transition-all',
          btnStyle: {}
        };
      case 'modern':
      default:
        return {
          card: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-gray-700 shadow-lg flex flex-col text-white',
          title: 'font-bold text-lg mb-2',
          price: 'px-3 py-1 rounded-full text-[13px] font-semibold inline-block mb-4',
          desc: 'text-gray-300 mb-6 text-[13px] flex-grow',
          btn: 'w-full bg-white text-gray-900 px-4 py-3 rounded-lg font-bold transition-all hover:scale-[1.02] shadow-md',
          btnStyle: { backgroundColor: themeColor || 'white', color: 'black' }
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.toLowerCase() === '\$\{products\}') {
          if (sellableProducts.length === 0) return null;
          return (
            <div key={index} className="not-prose font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className={styles.card}>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4 shadow-sm cursor-pointer" onClick={() => setSelectedProduct(product)} />
                  )}
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className={styles.desc + " line-clamp-3 cursor-pointer"} onClick={() => setSelectedProduct(product)} title="Click to read more">{product.description}</p>
                  <div className={styles.price} style={templateType === 'corporate' || templateType === 'modern' ? { color: themeColor } : {}}>
                    $\{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                  </div>
                  <div className="mt-auto w-full pt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-1/2 py-2 text-[13px] font-semibold border rounded-lg transition-colors border-crm-border text-crm-text hover:bg-crm-bg"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => alert('Online product purchasing coming soon! Please pick this up in-store during your next visit.')}
                      className={styles.btn + " !w-1/2 !mt-0 !py-2 !text-[13px]"}
                      style={templateType === 'modern' ? { backgroundColor: themeColor || 'white', color: 'black' } : styles.btnStyle}
                    >
                      {templateType === 'sporty' || templateType === 'editorial' ? 'Buy' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
                <div className="bg-crm-surface rounded-2xl w-full max-w-lg border border-crm-border shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 font-bold text-[13px]">✕</button>
                  {selectedProduct.imageUrl && (
                    <div className="w-full h-64 shrink-0 bg-crm-bg relative">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-8 overflow-y-auto">
                    <h3 className="font-bold text-2xl mb-2 text-crm-text" style={{ color: themeColor || 'inherit' }}>{selectedProduct.name}</h3>
                    <div className="font-bold text-xl mb-6 text-crm-text">
                      $\{typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : '0.00'}
                    </div>
                    <div className="prose prose-sm max-w-none text-crm-muted mb-8">
                      {selectedProduct.description?.split('\n').map((line: string, i: number) => (
                        <p key={i} className="mb-2">{line}</p>
                      ))}
                    </div>
                    <button
                      onClick={() => { setSelectedProduct(null); alert('Online product purchasing coming soon! Please pick this up in-store during your next visit.'); }}
                      className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: themeColor || '#111827' }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        } else if (part.toLowerCase() === '\$\{services\}') {
          if (services.length === 0) return null;
          return (
            <div key={index} className={`not-prose grid gap-6 my-8 font-sans ${templateType === 'minimal' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {services.map((service: any) => (
                  <div key={service.id} className={styles.card}>
                    {service.imageUrl && templateType !== 'minimal' && (
                      <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover rounded-lg mb-6 shadow-md" />
                    )}
                    
                    {templateType === 'minimal' ? (
                      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 mr-4">
                          <h3 className={styles.title}>{service.name}</h3>
                          <p className={styles.desc}>{service.description}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                          <div className="text-right mr-4 border-r border-gray-200 pr-4">
                              <span className={styles.price}>${service.price.toFixed(2)}</span>
                              <span className="block text-gray-400 text-[11px]">{service.duration}m</span>
                          </div>
                          <button onClick={() => onBookClick && onBookClick(service)} className={styles.btn} style={styles.btnStyle}>{ctaText}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col mb-4">
                          <h3 className={styles.title} style={templateType === 'sporty' || templateType === 'editorial' ? {} : { color: templateType === 'classic' || templateType === 'corporate' ? themeColor : undefined }}>
                            {service.name}
                          </h3>
                          <div className={styles.price} style={templateType === 'modern' ? { backgroundColor: `${themeColor || '#ffffff'}20`, color: themeColor || '#ffffff' } : (templateType === 'corporate' ? { color: themeColor } : {})}>
                            ${service.price.toFixed(2)} {templateType === 'classic' && ` • ${service.duration} MINS`}
                          </div>
                        </div>
        
                        {service.description && (
                          <p className={styles.desc}>{service.description}</p>
                        )}
        
                        <div className="mt-auto">
                          {templateType !== 'classic' && (
                            <div className={`text-[12px] opacity-70 mb-4 ${templateType === 'sporty' ? 'border-t border-current/10 pt-4 uppercase tracking-widest font-bold' : ''}`}>
                              ⏱️ {service.duration} minutes
                            </div>
                          )}
                          <button
                            onClick={() => onBookClick && onBookClick(service)}
                            className={styles.btn}
                            style={styles.btnStyle}
                          >
                            {templateType === 'sporty' || templateType === 'editorial' ? ctaText : ctaText}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          );
        } else if (part.toLowerCase() === '\$\{reviews\}') {
          return (
            <div key={index} className="not-prose w-full">
               <InteractiveReviewsSection shopId={shop.id} initialReviews={reviews} themeColor={themeColor} />
            </div>
          );
        } else if (part.toLowerCase() === '\$\{team\}') {
          if (staffMembers.length === 0) return null;
          return (
            <div key={index} className="not-prose grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 font-sans">
              {staffMembers.map((member: any) => (
                <div key={member.id} className={styles.card}>
                   {member.imageUrl ? (
                     <img src={member.imageUrl} alt={member.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 mb-4" style={{ borderColor: themeColor || '#ccc' }} />
                   ) : (
                     <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 flex items-center justify-center text-gray-500 text-3xl mb-4 border-4" style={{ borderColor: themeColor || '#ccc' }}>
                       {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                     </div>
                   )}
                   <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' ? { color: themeColor } : {}}>{member.name}</h3>
                   <p className="text-crm-muted text-[13px] uppercase tracking-wider mb-2">{member.role === 'SHOP_ADMIN' ? 'Owner / Master Barber' : 'Barber'}</p>
                   {member.clientNotes && <p className={styles.desc}>{member.clientNotes}</p>}
                   <div className="mt-auto pt-4">
                     <button onClick={() => onBookClick && onBookClick(null)} className={styles.btn} style={styles.btnStyle}>{ctaText}</button>
                   </div>
                </div>
              ))}
            </div>
          );
        } else if (part.toLowerCase() === '\$\{gallery\}') {
          if (galleryImages.length === 0) return null;
          return (
            <div key={index} className="not-prose columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 my-8">
              {galleryImages.map((img: any) => (
                <div key={img.id} className="relative group overflow-hidden rounded-xl break-inside-avoid">
                  <img src={img.imageUrl} alt={img.caption || 'Gallery Image'} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-[13px]">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        } else if (part.toLowerCase() === '\$\{contact\}') {
          const address = shop.customization?.address;
          const phone = shop.customization?.phone;
          const email = shop.customization?.email;
          const hours = shop.customization?.businessHours;
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

          return (
            <div key={index} className={`not-prose my-8 p-8 md:p-12 ${styles.card}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'classic' ? { color: themeColor } : {}}>Contact Us</h3>
                  <div className="space-y-6 mt-6">
                    {address && (
                      <div className="flex items-start gap-4">
                        <span className="text-xl" style={{ color: themeColor || 'inherit' }}>📍</span>
                        <p className={styles.desc}>{address}</p>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-4">
                        <span className="text-xl" style={{ color: themeColor || 'inherit' }}>📞</span>
                        <a href={`tel:${phone}`} className={styles.desc}>{phone}</a>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-4">
                        <span className="text-xl" style={{ color: themeColor || 'inherit' }}>✉️</span>
                        <a href={`mailto:${email}`} className={styles.desc}>{email}</a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-current/10">
                    <h4 className="font-bold mb-4 uppercase tracking-widest text-[13px] opacity-70">Business Hours</h4>
                    <div className="space-y-2">
                      {hours && days.map(day => {
                        const h = hours[day];
                        return (
                          <div key={day} className="flex justify-between text-[13px]">
                            <span className="capitalize opacity-80">{day}</span>
                            <span className="font-medium">{h ? `${h.open} - ${h.close}` : 'Closed'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {address && (
                  <div className="rounded-xl overflow-hidden shadow-inner h-64 md:h-full min-h-[300px] border border-current/10">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }
      })}
    </div>
  );
}


export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed, reviews = [], dynamicTemplateHtml, dynamicTemplateCss }: any) {
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const pathname = usePathname() || '/';

    const handleBookClick = (service: any) => {
        if (typeof window !== 'undefined' && (window as any).BarberBooking) {
            (window as any).BarberBooking.open(service?.id);
        } else if (typeof window !== 'undefined' && (window as any).openBarberSaasChat) {
            (window as any).openBarberSaasChat(service?.name);
        } else {
            setSelectedService(service);
        }
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

            if (typeof window !== 'undefined' && (window as any).BarberBooking) {
                (window as any).BarberBooking.open(service?.id);
            } else if (typeof window !== 'undefined' && (window as any).openBarberSaasChat) {
                (window as any).openBarberSaasChat(service?.name);
            } else if (service) {
                setSelectedService(service);
            }
        }
    };
    // ── Normalised contact helpers (supports both old flat shape and new nested shape) ──
    const c = shop.customization || {};
    const pages = c.pages || [];
    const fontFamily = c.fontFamily || 'Inter';
    const ctaText = c.ctaText || 'Book';
    const announcement = c.announcement;
    const heroVideoUrl = c.heroVideoUrl;
    const shopPhone   = c.contact?.phone   || c.phone   || '';
    const shopEmail   = c.contact?.email   || c.email   || '';
    const shopWebsite = c.contact?.website || c.website || '';
    const shopAddress = formatAddress(c.address);
    const shopFB      = c.contact?.facebook  || c.social?.facebook  || '';
    const shopIG      = c.contact?.instagram || c.social?.instagram || '';
    const shopTW      = c.contact?.twitter   || c.social?.twitter   || '';
    const logoUrl     = c.logoUrl || null;
    const heroImageUrl = c.heroImageUrl || c.bannerUrl || null;

    // Auth button for client sign-in/out
    const authButton = (
        <div className="absolute top-6 right-6 z-50">
            <SupabaseAuthButton redirectUrl={pathname} />
        </div>
    );

    if (dynamicTemplateHtml) {
        return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-surface text-crm-text font-sans relative" onClick={handleDynamicTemplateClick}>
                {authButton}
                {dynamicTemplateCss && <style dangerouslySetInnerHTML={{ __html: dynamicTemplateCss }} />}
                <div dangerouslySetInnerHTML={{ __html: dynamicTemplateHtml }} />
                
                {selectedService && (
                    <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
                )}
            </main>
        );
    }

    if (templateType === 'social') {
        return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-surface text-crm-text font-sans relative flex flex-col items-center py-12 px-4">
                <div className="absolute top-4 right-4 z-50">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
                
                {logoUrl ? (
                    <img src={logoUrl} alt={shop.name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md border-2" style={{ borderColor: primaryColor }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-crm-bg flex items-center justify-center text-crm-muted text-4xl mb-4 font-bold shadow-inner border-2" style={{ borderColor: primaryColor }}>
                        {shop.name.charAt(0)}
                    </div>
                )}
                <h1 className="font-bold text-2xl mb-2 text-center" style={{ color: primaryColor }}>{shop.name}</h1>
                {shop.slogan && <p className="text-crm-text font-medium text-[15px] mb-2 text-center">{shop.slogan}</p>}
                {shop.description && <p className="text-crm-muted text-[13px] mb-8 text-center max-w-sm">{shop.description}</p>}
                
                <div className="w-full max-w-md flex flex-col gap-4 mb-12">
                    <button
                        onClick={() => handleBookClick(null)}
                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                    >
                        {ctaText}
                    </button>
                    {shopWebsite && (
                        <a href={shopWebsite} target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl font-bold text-crm-text bg-crm-bg border border-crm-border text-center shadow-sm transition-transform hover:scale-[1.02]">
                            Visit Website
                        </a>
                    )}
                </div>

                <div className="w-full max-w-md">
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <div key={p.id} className="mb-12">
                            {p.title !== 'Home' && <h2 className="font-bold text-xl mb-4 text-center" style={{ color: primaryColor }}>{p.title}</h2>}
                            <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="w-full" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-12 pb-4 flex gap-8 text-2xl">
                    {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="text-crm-muted hover:text-crm-text transition-transform hover:scale-110">📘</a>}
                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-crm-muted hover:text-crm-text transition-transform hover:scale-110">📸</a>}
                    {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="text-crm-muted hover:text-crm-text transition-transform hover:scale-110">🐦</a>}
                </div>

                {selectedService && (
                    <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
                )}
            </main>
        );
    }

    if (templateType === 'off') {
        return (
            <main className="h-[100dvh] flex flex-col bg-gray-50 overflow-y-auto">
                <div className="flex-none p-4 flex justify-end">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col" style={{ height: '700px', maxHeight: '90vh' }}>
                        {logoUrl ? (
                            <div className="p-6 pb-0 text-center shrink-0">
                                <img src={logoUrl} alt={shop.name} className="h-16 mx-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                        ) : (
                            <div className="p-6 pb-0 text-center shrink-0">
                                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden relative">
                            <BookingWizard shopId={shop.id} />
                        </div>
                    </div>
                    <p className="mt-8 text-gray-400 text-sm text-center">
                        This shop does not have a public storefront.<br />Use this widget to book your appointment.
                    </p>
                </div>
            </main>
        );
    }

    if (templateType === 'sporty') {
        return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-surface text-crm-text font-sans relative">
                {/* Top Bar - Contact Info & Auth */}
                <div className="bg-crm-surface text-crm-text text-[11px] py-2 px-4 flex justify-end items-center space-x-4">
                    {shopPhone && <span>{shopPhone}</span>}
                    {shopEmail && <span>{shopEmail}</span>}
                    <div className="relative">
                        <SupabaseAuthButton redirectUrl={pathname} />
                    </div>
                </div>
    
                {/* Header / Nav */}
                <header className="border-b-4 border-crm-border sticky top-0 bg-crm-surface z-40 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center overflow-x-auto hide-scrollbar">
                        {logoUrl ? (
                            <img src={logoUrl} alt={shop.name} className="h-10 shrink-0 mr-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                            <h1 className="font-black italic uppercase tracking-tighter shrink-0 mr-6 text-2xl font-bold" style={{ color: sportRed }}>
                                {shop.name}
                            </h1>
                        )}
                        {pages.filter((p: any) => p.isVisible).length > 0 && (
                            <nav className="flex gap-4 sm:gap-6 shrink-0">
                                <a href="#" className="text-[13px] font-bold uppercase transition-colors text-crm-muted hover:text-black">Home</a>
                                {pages.filter((p: any) => p.isVisible).map((p: any) => (
                                    <a key={p.id} href={`#${p.id}`} className="text-[13px] font-bold uppercase transition-colors text-crm-muted hover:text-black">{p.title}</a>
                                ))}
                            </nav>
                        )}
                    </div>
                </header>
    
                                        {/* Hero Section */}
                <section className="bg-crm-bg border-b border-crm-border relative bg-cover bg-center" style={{ backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined }}><div className={heroImageUrl ? "absolute inset-0 bg-crm-surface/80" : ""} />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center md:text-left flex flex-col md:flex-row items-center relative z-10">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h2 className="font-black uppercase italic leading-none mb-6 text-xl font-bold">
                                The MVP <br/> Haircut <br/> Experience.
                            </h2>
                            <p className="text-crm-text font-semibold mb-8 max-w-lg text-[13px]">
                                {shop.description || "Precision cuts, legendary service, and the ultimate environment."}
                            </p>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full max-w-md aspect-square bg-gray-300 transform -rotate-3 overflow-hidden shadow-2xl border-8 border-white">
                                 <div className="w-full h-full bg-crm-surface flex items-center justify-center">
                                     <span className="text-6xl" style={{ color: sportRed }}>💈</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </section>
    
                {pages.filter((p: any) => p.isVisible).map((p: any) => (

                    <section key={p.id} id={p.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
                        <h1 className="font-black uppercase italic mb-8 text-2xl font-bold" style={{ color: sportRed }}>{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} themeColor={sportRed} className="prose prose-lg max-w-none text-crm-text"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </section>
            ))}



          {/* Footer */}
                <footer className="bg-crm-surface text-crm-text py-16 uppercase text-[13px] tracking-widest">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            <div className="md:col-span-2">
                                <h3 className="font-black italic mb-2 text-lg font-bold" style={{ color: sportRed }}>{shop.name}</h3>
                                {shop.slogan && <div className="text-crm-text font-black italic mb-4 uppercase tracking-widest">{shop.slogan}</div>}
                                <p className="text-crm-muted normal-case tracking-normal mb-6 max-w-sm text-[13px]">
                                    {shop.description}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 text-crm-muted text-base font-semibold">Quick Links</h4>
                                <ul className="space-y-4 font-bold">
                                    
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 text-crm-muted text-base font-semibold">Connect</h4>
                                <div className="flex flex-col space-y-4 font-bold">
                                    {shopFB && <a href={shopFB} className="hover:text-status-cancelled transition-colors">Facebook</a>}
                                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="hover:text-status-cancelled transition-colors">Instagram</a>}
                                    {shopTW && <a href={shopTW} className="hover:text-status-cancelled transition-colors">Twitter</a>}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-crm-muted font-bold text-[11px]">
                            <p className="text-[13px]">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                            {shopAddress && <p className="mt-4 md:mt-0 text-[13px]">{shopAddress}</p>}
                        </div>
                    </div>
                </footer>

                {selectedService && (
                    <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
                )}
            </main>
        );
      }
      
      if (templateType === 'corporate') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-bg text-crm-text font-sans relative">
            <header className="bg-crm-surface shadow-md relative z-40">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4 overflow-x-auto hide-scrollbar">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-10 shrink-0 mr-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-bold shrink-0 mr-6 text-2xl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>}
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-4 sm:gap-6 shrink-0 mr-6">
                        <a href="#" className="text-[13px] font-bold transition-colors text-crm-muted hover:text-crm-text">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="text-[13px] font-bold transition-colors text-crm-muted hover:text-crm-text">{p.title}</a>
                        ))}
                    </nav>
                )}
                <div className="relative shrink-0">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
              </div>
            </header>

                        <section className="bg-crm-surface relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: heroImageUrl && !heroVideoUrl ? `url(${heroImageUrl})` : undefined }}>
        {heroVideoUrl && (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        )}
        <div className={(heroImageUrl || heroVideoUrl) ? "absolute inset-0 bg-crm-surface/70 z-0" : "z-0"} />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
                    <h2 className="font-extrabold text-crm-text mb-4 text-xl font-bold">{shop.slogan || shop.description || "Quality Service, Every Time."}</h2>
                    <p className="text-crm-muted text-[13px]">Find your perfect look with our expert stylists.</p>
                </div>
            </section>
    
            {pages.filter((p: any) => p.isVisible).map((p: any) => (

                <section key={p.id} id={p.id} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
                    <h1 className="font-bold text-crm-text mb-8 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-crm-text"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                </section>
            ))}

            <footer className="bg-crm-surface text-crm-text">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="font-bold mb-4 text-lg font-bold">{shop.name}</h3>
                    {shopAddress && <p className="text-crm-muted text-[13px]">{shopAddress}</p>}
                  </div>
                  <div>
                    <h4 className="font-bold mb-4 text-base font-semibold">Contact</h4>
                    {shopPhone && <p className="text-crm-muted text-[13px]">{shopPhone}</p>}
                    {shopEmail && <p className="text-crm-muted text-[13px]">{shopEmail}</p>}
                  </div>
                  <div>
                    <h4 className="font-bold mb-4 text-base font-semibold">Follow Us</h4>
                    <div className="flex gap-4">
                      {shopFB && <a href={shopFB} className="text-crm-muted hover:text-crm-text">Facebook</a>}
                      {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="text-crm-muted hover:text-crm-text">Instagram</a>}
                      {shopTW && <a href={shopTW} className="text-crm-muted hover:text-crm-text">Twitter</a>}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-crm-muted text-[13px]">
                  <p className="text-[13px]">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                </div>
              </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      if (templateType === 'noir') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-surface text-crm-text font-serif relative">
            <div className="absolute top-6 left-8 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-6 font-sans text-[11px] uppercase tracking-[0.2em]">
                        <a href="#" className="transition-colors text-crm-muted hover:text-crm-text">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="transition-colors text-crm-muted hover:text-crm-text">{p.title}</a>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-8 z-50">
                <SupabaseAuthButton redirectUrl={pathname} />
            </div>
            
            <div className="p-8 md:p-16 pt-24 md:pt-32">
                              <header className="text-center mb-16">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-black uppercase tracking-tighter text-2xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-white font-bold uppercase tracking-[0.2em] mt-4 mb-2 text-sm">{shop.slogan}</p>}
                <p className="text-crm-muted mt-2 text-[13px]">{shop.description}</p>
              </header>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

                    <section key={p.id} id={p.id} className="max-w-3xl mx-auto min-h-[60vh]">
                        <h1 className="font-black uppercase tracking-tighter mb-8 text-center text-2xl font-bold">{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-crm-muted font-sans"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </section>
            ))}
            </div>

            

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      if (templateType === 'sunset') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-purple-900 via-black to-orange-900 text-crm-text font-sans relative">
            <div className="absolute w-full top-0 left-0 p-4 sm:p-6 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center z-50">
             {pages.filter((p: any) => p.isVisible).length > 0 ? (
                 <nav className="flex gap-4 sm:gap-6 bg-crm-surface px-4 sm:px-6 py-2 rounded-full backdrop-blur-md border border-status-pending/30 overflow-x-auto max-w-[calc(100vw-100px)] hide-scrollbar">
                    <a href="#" className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-status-pending">Home</a>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <a key={p.id} href={`#${p.id}`} className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-status-pending">{p.title}</a>
                    ))}
                 </nav>
             ) : (
                 <div />
             )}
             <SupabaseAuthButton redirectUrl={pathname} />
            </div>

            <div className="p-8 md:p-12 pt-24 md:pt-32">
                            <header className="text-center mb-16">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-4 text-2xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-orange-300 font-medium tracking-wide mt-2 mb-4 text-sm">{shop.slogan}</p>}
                <p className="text-purple-200/70 text-[13px]">{shop.description}</p>
              </header>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

                <section key={p.id} id={p.id} className="max-w-4xl mx-auto min-h-[60vh]">
                    <div className="bg-crm-surface backdrop-blur-sm border border-status-pending/30 rounded-lg p-8 md:p-12">
                        <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-8 text-2xl font-bold">{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-purple-200/80"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </div>
                </section>
            ))}
            </div>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      if (templateType === 'editorial') {
        const editorial = shop.customization?.editorialCustomization || {};
        
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#121412] text-[#e3e2e0] selection:bg-[#d4af37] selection:text-[#554300] font-sans">
            <style dangerouslySetInnerHTML={{__html: `
              @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
              .font-headline { font-family: 'Noto Serif', serif; }
              .font-body { font-family: 'Manrope', sans-serif; }
              .font-label { font-family: 'Manrope', sans-serif; }
            `}} />
            
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-[#121412]/80 backdrop-blur-xl shadow-none no-border">
              <div className="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
                <div className="text-2xl font-bold font-headline tracking-tighter" style={{ color: primaryColor }}>
                  {shop.name}
                </div>
                {/* Desktop Navigation */}
                
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                        const servicesSection = document.getElementById('services');
                        if (servicesSection) {
                            servicesSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    className="px-6 py-3 rounded-xl font-medium hover:opacity-80 transition-all duration-300 text-[#121412]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </nav>
    
            <div className="pt-24">
                            {/* Hero Section */}
              <section className="relative min-h-[921px] flex items-center px-8 md:px-16 overflow-hidden">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                  <div className="md:col-span-6 z-10">
                    <span className="font-label tracking-[0.2em] uppercase text-[11px] mb-6 block" style={{ color: primaryColor }}>
                      {editorial.heroTagline || 'Editorial Excellence'}
                    </span>
                    <h1 
                      className="font-headline leading-[1.1] mb-8 tracking-tight text-2xl font-bold"
                      dangerouslySetInnerHTML={{ __html: editorial.heroTitle || `Your Sanctuary of <br/> <span class="italic" style="color: ${primaryColor}">Sophisticated Care</span>` }}
                    />
                    <p className="text-[#d0c5af] font-body max-w-md mb-10 leading-relaxed text-[13px]">
                      {editorial.heroSubtitle || 'Experience beauty as an art form. Our atelier provides a curated space for those who appreciate the finer details of self-ceremony.'}
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                            const servicesSection = document.getElementById('services');
                            if (servicesSection) {
                                servicesSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="px-8 py-4 rounded-lg hover:shadow-lg transition-all font-semibold text-[#121412]"
                        style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
                      >
                        Book Now
                      </button>
                      <a href="#services" className="font-semibold flex items-center gap-2 group px-4 py-4" style={{ color: secondaryColor }}>
                        Explore Services
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                  <div className="md:col-span-6 relative h-[600px] md:h-[750px]">
                    <div className="absolute inset-0 bg-[#1a1c1a] rounded-3xl overflow-hidden -rotate-2 transform translate-x-4 translate-y-4"></div>
                    <img 
                      alt="Hero" 
                      className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-xl transition-transform hover:scale-105 duration-700" 
                      src={editorial.heroImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPRu8QRu8seSz1ZA0n6LiPGRgqS7aZEcjxutc8fOcO1ZIkoJH2Umtws1TFTbdJwWCpmXEE_T0bVF00Q1EwlHR5KpYdbkMHCu2nUg2NAe5C2pfVotvKBcYkKM63pa2s4XXMCSh4EVxf389QPikRuNYPp_EHSwR5QQSbPcaysTObNr3wOBttSWwh41x9HEbYtenN4fQFtQfUC-criMC9c8Li4jj4D1-zB8_8LZYeg0ReRDBSudtfcTLc4qJDHasnl5yxlX6EAv0YYbw"}
                    />
                    <div className="absolute bottom-12 -left-12 bg-[#0d0f0d] p-6 rounded-2xl shadow-lg hidden lg:block">
                      <p className="font-headline italic text-[13px]" style={{ color: primaryColor }}>"The standard of beauty refined."</p>
                    </div>
                  </div>
                </div>
              </section>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

                 <section key={p.id} id={p.id} className="py-32 px-8 min-h-[70vh]">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="font-headline mb-12 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none font-body text-[#d0c5af]"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </div>
                </section>
            ))}

            {/* Gallery Section */}
              <section id="gallery" className="py-32 px-8 bg-[#121412]">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                      <span className="font-label tracking-widest uppercase text-[11px] mb-2 block" style={{ color: primaryColor }}>{editorial.gallerySubtitle || 'Our Work'}</span>
                      <h2 className="font-headline text-xl font-bold">{editorial.galleryTitle || 'The Gallery'}</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
                    {editorial.galleryImages?.[0] && (
                      <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden relative group">
                        <img alt="Gallery 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={editorial.galleryImages[0]} />
                      </div>
                    )}
                    {editorial.galleryImages?.[1] && (
                      <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
                        <img alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={editorial.galleryImages[1]} />
                      </div>
                    )}
                    {editorial.galleryImages?.[2] && (
                      <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden relative group">
                        <img alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={editorial.galleryImages[2]} />
                      </div>
                    )}
                    {editorial.galleryImages?.[3] && (
                      <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
                        <img alt="Gallery 4" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={editorial.galleryImages[3]} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
    
              {/* Client Stories */}
              {editorial.testimonials && editorial.testimonials.length > 0 && (
                <section className="py-32 px-8 bg-[#1a1c1a] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#292a29] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
                      <div className="md:col-span-4">
                        <h2 
                          className="font-headline mb-6 leading-tight text-xl font-bold"
                          dangerouslySetInnerHTML={{ __html: editorial.testimonialsTitle || `Reflections <br/>from Our <br/><span class="italic" style="color: ${primaryColor}">Atelier Guests</span>` }}
                        />
                      </div>
                      <div className="md:col-span-8 flex gap-8">
                        {editorial.testimonials.slice(0,2).map((t: any, i: number) => (
                          <div key={i} className={`bg-[#0d0f0d] p-10 rounded-3xl shadow-sm max-w-sm ${i === 1 ? 'hidden md:block opacity-60' : ''}`}>
                            <span className="material-symbols-outlined text-5xl mb-6" style={{ color: secondaryColor }}>format_quote</span>
                            <p className="font-body italic text-[#e3e2e0] mb-8 leading-relaxed text-[13px]">"{t.quote}"</p>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-[#292a29]"></div>
                              <div>
                                <p className="font-bold text-[#e3e2e0] text-[13px]">{t.author}</p>
                                <p className="text-[#d0c5af] uppercase tracking-widest text-[13px]">{t.role}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
    
              {/* Visit Us Section */}
              <section id="contact" className="py-32 px-8 bg-[#121412]">
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                      <h2 className="font-headline mb-12 text-xl font-bold">{editorial.visitUsTitle || 'Visit the Atelier'}</h2>
                      <div className="space-y-12">
                        <div className="flex gap-6">
                          <span className="material-symbols-outlined" style={{ color: primaryColor }}>location_on</span>
                          <div>
                            <h4 className="font-bold mb-2 text-base font-semibold">Our Location</h4>
                            <p className="text-[#d0c5af] text-[13px]">{shopAddress || 'Address not provided'}</p>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <span className="material-symbols-outlined" style={{ color: primaryColor }}>call</span>
                          <div>
                            <h4 className="font-bold mb-2 text-base font-semibold">Contact Details</h4>
                            <p className="text-[#d0c5af] text-[13px]">{shop.customization?.phone || 'Phone not provided'}<br/>{shop.customization?.email || 'Email not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-[500px] bg-[#1a1c1a] rounded-3xl overflow-hidden relative">
                      <div className="absolute inset-0 grayscale contrast-125 opacity-40">
                        <img alt="Map View" className="w-full h-full object-cover" src={editorial.mapImageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBPBUELt3H48sCkgUERZL-bYjLp_g4nyaMrAaWgWqv1QMVuCaaZub4OKguOms2xp_UClFnqWJd5F1jE8c8_9V8GbtLNhZwardBznAcbPP6O5ofImMcqWosMtI8MOhCDK6ERy1aepwuU8Jjoomg4v3oHOH1T-k1vmTJMASUVHIRN_wlzdQm3IGpjqWBgBHRYOEeLiJKp7GgD_lnnDst0M8NdV_0egB1TFqQmXLS5pgBlZELH0ExIL_x5_OEryY1I7lK2NPfP3cKIUjs"} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#121412] p-8 rounded-2xl shadow-xl border text-center max-w-xs" style={{ borderColor: `${primaryColor}20` }}>
                          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <span className="material-symbols-outlined text-[#121412]">pin_drop</span>
                          </div>
                          <p className="font-headline text-[13px]">{shop.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            

            </div>
    
            {/* Footer */}
            <footer className="w-full rounded-t-3xl bg-[#0d0f0d]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-16 max-w-7xl mx-auto">
                <div className="space-y-6">
                  <div className="text-xl font-headline text-stone-200 mb-2">{shop.name}</div>
                  {shop.slogan && <div className="text-[#d4af37] font-serif italic mb-4">{shop.slogan}</div>}
                  <p className="text-stone-400 font-body leading-relaxed text-[13px]">{shop.description || "A destination for curated beauty and refined wellness."}</p>
                </div>
                <div className="flex flex-col items-start md:items-end space-y-6 md:col-start-3">
                  <div className="flex gap-6">
                    <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">public</span></a>
                    <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">photo_camera</span></a>
                  </div>
                  <p className="text-stone-400 font-body tracking-wide uppercase text-right text-[13px]">
                    &copy; {new Date().getFullYear()} {shop.name}.
                  </p>
                </div>
              </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      if (templateType === 'minimal') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#fafafa] text-[#333333] font-sans relative">
            {/* Header / Nav */}
            <header className="absolute w-full top-0 left-0 px-8 py-6 flex flex-wrap justify-between items-center z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-8 font-medium text-[13px] tracking-widest uppercase">
                        <a href="#" className="transition-opacity hover:opacity-60 text-gray-500">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="transition-opacity hover:opacity-60 text-gray-500">{p.title}</a>
                        ))}
                    </nav>
                )}
                <div className="ml-auto">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
            </header>

            {/* Hero / Shop Info */}
            <section className="max-w-4xl mx-auto px-6 pt-40 pb-20 flex flex-col items-center text-center border-b border-gray-200">
                {logoUrl ? (
                    <img src={logoUrl} alt={shop.name} className="h-28 object-contain mb-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                    <h1 className="font-light tracking-tight text-5xl mb-8" style={{ color: primaryColor }}>{shop.name}</h1>
                )}
                {shop.slogan && <p className="text-gray-900 font-medium text-lg tracking-wide mb-6">{shop.slogan}</p>}
                {shop.description && <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">{shop.description}</p>}
                
                <div className="flex flex-wrap justify-center gap-8 mt-10 text-[13px] text-gray-400 font-medium uppercase tracking-widest">
                    {shopPhone && <a href={`tel:${shopPhone}`} className="hover:text-gray-800 transition-colors">📞 {shopPhone}</a>}
                    {shopAddress && <span>📍 {shopAddress}</span>}
                </div>
            </section>
    
            {/* Custom Pages */}
            {pages.filter((p: any) => p.isVisible).map((p: any) => (
                <section key={p.id} id={p.id} className="max-w-4xl mx-auto px-6 py-24 min-h-[50vh]">
                    <h2 className="font-light tracking-wide mb-16 text-center text-3xl text-gray-900" style={{ color: primaryColor }}>{p.title}</h2>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed mx-auto" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
                </section>
            ))}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-16 text-center text-[12px] font-medium tracking-widest uppercase text-gray-400">
                 <p className="mb-4">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                 <div className="flex justify-center gap-6 text-lg">
                    {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📘</a>}
                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📸</a>}
                    {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">🐦</a>}
                 </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      if (templateType === 'classic') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#fdfbf7] text-[#2c1e16] font-serif relative">
            <div className="absolute top-6 left-8 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-6 font-sans text-[11px] font-bold uppercase tracking-widest">
                        <a href="#" className="transition-colors text-[#8b7355] hover:text-[#2c1e16]">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="transition-colors text-[#8b7355] hover:text-[#2c1e16]">{p.title}</a>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-8 z-50">
                <SupabaseAuthButton redirectUrl={pathname} />
            </div>

                        <header className="border-b-4 border-[#2c1e16] pt-32 pb-16 text-center relative bg-cover bg-center" style={{ backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : "url('https://www.transparenttextures.com/patterns/aged-paper.png')" }}>
    <div className={heroImageUrl ? "absolute inset-0 bg-[#fdfbf7]/80" : ""} />
    <div className="relative z-10">
              {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 mx-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-bold uppercase tracking-widest mb-4 text-2xl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="h-px w-16 bg-[#2c1e16]"></div>
                <span className="italic text-lg">Est. {new Date(shop.createdAt).getFullYear()}</span>
                <div className="h-px w-16 bg-[#2c1e16]"></div>
              </div>
              {shop.slogan && <h2 className="text-[#8b7355] font-serif text-xl italic mb-6">{shop.slogan}</h2>}
              {shop.description && <p className="max-w-xl mx-auto text-[#5a4634] text-[13px]">{shop.description}</p>}
            </div>
            </header>
    
            {pages.filter((p: any) => p.isVisible).map((p: any) => (

                <section key={p.id} id={p.id} className="max-w-4xl mx-auto px-8 py-32 min-h-[60vh]">
                    <h1 className="font-bold uppercase tracking-widest mb-12 text-center text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-[#5a4634]"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                </section>
            ))}

            <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-center text-[13px] font-sans tracking-widest uppercase">
                 {shopAddress && <p className="mb-2 text-[13px]">{shopAddress}</p>}
                 {!shopAddress && <p className="mb-2 text-[13px]">Visit us today</p>}
                 <p className="text-[13px]">{shopPhone}{shopPhone && shopEmail ? ' | ' : ''}{shopEmail}</p>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    
      // Default 'modern' template (the one that was originally there)
      return (
        <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
          <header className="absolute w-full top-0 left-0 p-4 sm:p-6 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center z-50">
             {pages.filter((p: any) => p.isVisible).length > 0 ? (
                 <nav className="flex gap-4 sm:gap-6 bg-crm-surface px-4 sm:px-6 py-2 rounded-full backdrop-blur-md border border-crm-border shadow-sm overflow-x-auto max-w-[calc(100vw-100px)] hide-scrollbar">
                    <a href="#" className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-crm-text">Home</a>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <a key={p.id} href={`#${p.id}`} className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-crm-text">{p.title}</a>
                    ))}
                 </nav>
             ) : (
                 <div />
             )}
             <SupabaseAuthButton redirectUrl={pathname} />
          </header>

                        {/* Hero Section */}
              <section 
                className="relative bg-cover bg-center border-b border-crm-border pt-16 md:pt-8"
                style={{ borderBottomColor: primaryColor, backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined }}
              >
                <div className={heroImageUrl ? "absolute inset-0 bg-crm-darkBase/80" : "absolute inset-0 bg-crm-surface backdrop-blur-md"} />
                <div className="relative z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
              <div className="text-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <h1 
                    className="font-bold mb-6 text-2xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    {shop.name}
                  </h1>
                )}
                {shop.slogan && (
                  <p className="text-white font-medium text-lg mb-4 opacity-90">{shop.slogan}</p>
                )}
                {shop.description && (
                  <p className="text-crm-muted max-w-2xl mx-auto text-[13px] mb-8">
                    {shop.description}
                  </p>
                )}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleBookClick(null)}
                    className="font-bold text-white px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] text-[14px] uppercase tracking-widest"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
                </div>
          </section>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

            <section key={p.id} id={p.id} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[80vh]">
               <div className="bg-crm-surface p-8 md:p-12 rounded-2xl border border-crm-border shadow-sm shadow-xl">
                  <h1 className="font-bold mb-8 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                  <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none text-crm-muted"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
               </div>
            </section>
            ))}

          {/* Footer */}
          <footer className="bg-crm-surface border-t border-crm-border py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-crm-text font-bold mb-4 text-lg font-bold">{shop.name}</h3>
                  <p className="text-crm-muted mb-4 text-[13px]">
                    {shop.description || 'Your trusted service provider'}
                  </p>
                  {shopAddress && (
                    <p className="text-crm-muted text-[13px]">{shopAddress}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-crm-text font-bold mb-4 text-base font-semibold">Contact</h4>
                  <ul className="space-y-2 text-crm-muted text-[13px]">
                    {shopPhone && (
                      <li>
                        <a href={`tel:${shopPhone}`} className="hover:text-crm-text transition">
                          📞 {shopPhone}
                        </a>
                      </li>
                    )}
                    {shopEmail && (
                      <li>
                        <a href={`mailto:${shopEmail}`} className="hover:text-crm-text transition">
                          ✉️ {shopEmail}
                        </a>
                      </li>
                    )}
                    {shopWebsite && (
                      <li>
                        <a href={shopWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-crm-text transition">
                          🌐 Website
                        </a>
                      </li>
                    )}
                    <li>
                      <a href="#services" className="hover:text-crm-text transition">
                        Services
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-crm-text font-bold mb-4 text-base font-semibold">Follow Us</h4>
                  <div className="flex gap-4">
                    {shopFB && (
                      <a
                        href={shopFB}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-crm-muted hover:text-crm-text transition"
                      >
                        Facebook
                      </a>
                    )}
                    {shopIG && (
                      <a
                        href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-crm-muted hover:text-crm-text transition"
                      >
                        Instagram
                      </a>
                    )}
                    {shopTW && (
                      <a
                        href={shopTW}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-crm-muted hover:text-crm-text transition"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-crm-border pt-8 text-center text-crm-muted text-[13px]">
                <p className="text-[13px]">
                  &copy; {new Date().getFullYear()} {shop.name}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {selectedService && (
            <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
          )}
        </main>
      );
}
