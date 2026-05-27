import InteractiveReviewsSection from '@/components/reviews/InteractiveReviewsSection';
import React, { useState } from "react";
import ReviewsSection from "./ReviewsSection";
import DOMPurify from 'isomorphic-dompurify';

export default function CustomPageContent({ content, shop, themeColor, className, onBookClick, reviews = [], templateType = 'modern' }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void, reviews?: any[], templateType?: string }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  if (!content) return null;
  
  // SECURITY: Sanitize the raw HTML to prevent Stored XSS
  const cleanContent = DOMPurify.sanitize(content);
  
  const parts = cleanContent.split(/(\$\{products\}|\$\{services\}|\$\{reviews\}|\$\{team\}|\$\{gallery\}|\$\{contact\})/gi);
  if (parts.length === 1) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: cleanContent }} />;
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
          card: 'bg-crm-surface border-2 border-crm-border p-6 text-center shadow-sm flex flex-col items-center',
          serviceCard: 'bg-crm-surface border-2 border-crm-border p-6 text-center shadow-sm flex flex-col',
          title: 'font-black uppercase italic text-lg',
          price: 'text-2xl font-bold mb-4',
          desc: 'text-crm-muted mb-6 min-h-[3rem] text-[13px]',
          btn: 'w-full text-white font-bold py-3 uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md',
          btnStyle: { backgroundColor: themeColor || '#ef4444' }
        };
      case 'corporate':
        return {
          card: 'bg-white rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col items-center text-center',
          serviceCard: 'bg-white rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col',
          title: 'font-bold text-gray-900 mb-2 text-lg',
          price: 'text-lg font-bold text-blue-600',
          desc: 'text-gray-500 mb-4 text-[13px] flex-grow',
          btn: 'w-full text-white font-bold py-2 rounded transition-all hover:opacity-90 shadow-sm mt-4',
          btnStyle: { backgroundColor: themeColor || '#2563eb' }
        };
      case 'noir':
        return {
          card: 'bg-transparent border border-gray-800 p-6 hover:bg-gray-900/50 transition-colors flex flex-col items-center text-center',
          serviceCard: 'bg-transparent border border-gray-800 p-6 hover:bg-gray-900/50 transition-colors flex flex-col text-center',
          title: 'font-bold uppercase tracking-widest text-lg mb-2',
          price: 'text-lg font-bold mb-4',
          desc: 'text-gray-400 mb-6 text-[13px] flex-grow',
          btn: 'w-full bg-white text-black font-bold uppercase py-3 tracking-[0.2em] hover:bg-gray-200 transition-colors',
          btnStyle: { color: 'black' }
        };
      case 'sunset':
        return {
          card: 'bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 text-white shadow-xl flex flex-col items-center text-center hover:border-orange-500/50 transition-colors',
          serviceCard: 'bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 text-white shadow-xl flex flex-col hover:border-orange-500/50 transition-colors',
          title: 'font-bold text-lg text-orange-400 mb-2',
          price: 'text-xl font-bold text-orange-400',
          desc: 'text-white/60 mb-4 text-[13px] flex-grow',
          btn: 'w-full bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold py-2 rounded transition-all hover:opacity-90 mt-4',
          btnStyle: {}
        };
      case 'editorial':
        return {
          card: 'bg-[#0d0f0d] p-8 rounded-2xl flex flex-col items-center text-center border border-[#292a29]',
          serviceCard: 'bg-[#0d0f0d] p-8 rounded-2xl flex flex-col border border-[#292a29]',
          title: 'font-serif text-crm-text text-xl mb-4',
          price: 'text-[13px] font-bold text-white mb-4',
          desc: 'text-crm-muted leading-relaxed text-[13px] mb-6 flex-grow',
          btn: 'font-semibold flex items-center justify-center gap-2 uppercase tracking-widest py-3 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors',
          btnStyle: themeColor ? { borderColor: themeColor, color: themeColor } : {}
        };
      case 'minimal':
        return {
          card: 'bg-transparent border border-gray-200 p-6 flex flex-col items-center text-center',
          serviceCard: 'bg-transparent border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between md:items-center',
          title: 'font-medium text-lg text-gray-900',
          price: 'font-medium text-gray-900',
          desc: 'text-gray-500 mt-2 text-[13px] leading-relaxed',
          btn: 'text-[13px] font-semibold hover:underline mt-4 md:mt-0',
          btnStyle: { color: themeColor || '#000' }
        };
      case 'classic':
        return {
          card: 'bg-[#fdfbf7] border border-[#e6d9c6] p-8 text-center flex flex-col items-center shadow-sm',
          serviceCard: 'bg-[#fdfbf7] border border-[#e6d9c6] p-8 text-center flex flex-col items-center shadow-sm',
          title: 'font-bold mb-2 text-lg text-crm-text',
          price: 'text-[#8b7355] text-[13px] tracking-widest uppercase mb-3 font-semibold',
          desc: 'text-crm-muted italic mb-6 text-[13px] flex-grow',
          btn: 'mt-auto border border-[#2c1e16] px-6 py-2 text-[11px] uppercase tracking-widest text-crm-text hover:bg-[#2c1e16] hover:text-[#fdfbf7] transition-all',
          btnStyle: {}
        };
      case 'modern':
      default:
        return {
          card: 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center',
          serviceCard: 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col',
          title: 'font-bold text-gray-900 text-lg mb-2',
          price: 'px-3 py-1 rounded-full text-[13px] font-bold inline-block mb-4',
          desc: 'text-gray-500 mb-6 text-[14px] flex-grow leading-relaxed',
          btn: 'w-full bg-gray-900 text-white px-4 py-3 rounded-xl font-bold transition-transform hover:scale-[1.02] shadow-sm',
          btnStyle: { backgroundColor: themeColor || '#111827' }
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
            <div key={index} className="not-prose font-sans w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className={styles.card}>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-xl mb-4 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedProduct(product)} />
                  )}
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' || templateType === 'modern' ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className={styles.desc + " line-clamp-2 cursor-pointer text-sm"} onClick={() => setSelectedProduct(product)} title="Click to read more">{product.description}</p>
                  <div className={styles.price} style={templateType === 'corporate' ? { color: themeColor } : {}}>
                    \$\{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                  </div>
                  <div className="mt-auto w-full pt-4 flex gap-3">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1 py-2 text-[13px] font-bold border-2 rounded-xl transition-colors border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => alert('Online product purchasing coming soon! Please pick this up in-store during your next visit.')}
                      className={styles.btn + " !flex-1 !mt-0 !py-2 !text-[13px]"}
                      style={styles.btnStyle}
                    >
                      {templateType === 'sporty' || templateType === 'editorial' ? 'Buy' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 font-bold text-[13px]">✕</button>
                  {selectedProduct.imageUrl && (
                    <div className="w-full h-64 shrink-0 bg-gray-100 relative">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-8 overflow-y-auto">
                    <h3 className="font-extrabold text-2xl mb-2 text-gray-900">{selectedProduct.name}</h3>
                    <div className="font-bold text-xl mb-6" style={{ color: themeColor || '#111827' }}>
                      \$\{typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : '0.00'}
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-600 mb-8 leading-relaxed">
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
            <div key={index} className={`not-prose w-full grid gap-6 my-8 font-sans ${templateType === 'minimal' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {services.map((service: any) => (
                  <div key={service.id} className={styles.serviceCard}>
                    {service.imageUrl && templateType !== 'minimal' && (
                      <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover rounded-xl mb-6 shadow-sm" />
                    )}
                    
                    {templateType === 'minimal' ? (
                      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between py-2">
                        <div className="flex-1 pr-6">
                          <h3 className={styles.title}>{service.name}</h3>
                          <p className={styles.desc}>{service.description}</p>
                        </div>
                        <div className="flex items-center gap-6 mt-4 md:mt-0 shrink-0">
                          <div className="text-right border-r border-gray-200 pr-6">
                              <span className={styles.price}>\$\{service.price.toFixed(2)}</span>
                              <span className="block text-gray-400 text-[12px] uppercase tracking-widest mt-1">{service.duration} min</span>
                          </div>
                          <button onClick={() => onBookClick && onBookClick(service)} className="bg-black text-white px-6 py-3 rounded-full text-[13px] font-bold hover:bg-gray-800 transition-colors uppercase tracking-wider" style={styles.btnStyle}>{ctaText}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col mb-4">
                          <h3 className={styles.title} style={templateType === 'sporty' || templateType === 'editorial' ? {} : { color: templateType === 'classic' || templateType === 'corporate' || templateType === 'modern' ? themeColor : undefined }}>
                            {service.name}
                          </h3>
                          <div className={styles.price} style={templateType === 'modern' ? { backgroundColor: `${themeColor || '#111827'}15`, color: themeColor || '#111827' } : (templateType === 'corporate' ? { color: themeColor } : {})}>
                            \$\{service.price.toFixed(2)} {templateType === 'classic' && ` • ${service.duration} MINS`}
                          </div>
                        </div>
        
                        {service.description && (
                          <p className={styles.desc}>{service.description}</p>
                        )}
        
                        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                          {templateType !== 'classic' && (
                            <div className={`text-[12px] opacity-70 font-semibold uppercase tracking-widest ${templateType === 'sporty' ? 'text-crm-muted' : 'text-gray-500'}`}>
                              ⏱️ {service.duration} MIN
                            </div>
                          )}
                          <button
                            onClick={() => onBookClick && onBookClick(service)}
                            className={styles.btn + (templateType === 'modern' ? ' !w-auto px-8' : '')}
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
            <div key={index} className="not-prose w-full my-8">
               <InteractiveReviewsSection shopId={shop.id} initialReviews={reviews} themeColor={themeColor} />
            </div>
          );
        } else if (part.toLowerCase() === '\$\{team\}') {
          if (staffMembers.length === 0) return null;
          return (
            <div key={index} className="not-prose grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 font-sans w-full">
              {staffMembers.map((member: any) => (
                <div key={member.id} className={styles.card}>
                   {member.imageUrl ? (
                     <img src={member.imageUrl} alt={member.name} className="w-28 h-28 rounded-full mx-auto object-cover border-4 mb-6 shadow-sm" style={{ borderColor: themeColor || '#e5e7eb' }} />
                   ) : (
                     <div className="w-28 h-28 rounded-full mx-auto bg-gray-100 flex items-center justify-center text-gray-400 text-2xl mb-6 border-4 shadow-sm" style={{ borderColor: themeColor || '#e5e7eb' }}>
                       {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                     </div>
                   )}
                   <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' || templateType === 'modern' ? { color: themeColor } : {}}>{member.name}</h3>
                   <p className="text-gray-500 text-[12px] font-bold uppercase tracking-wider mb-4">{member.role === 'SHOP_ADMIN' ? 'Master Barber' : 'Barber'}</p>
                   {member.shopClients?.[0]?.clientNotes && <p className={styles.desc}>{member.shopClients[0].clientNotes}</p>}
                   <div className="mt-auto pt-4 w-full">
                     <button onClick={() => onBookClick && onBookClick(null)} className={styles.btn} style={styles.btnStyle}>{ctaText}</button>
                   </div>
                </div>
              ))}
            </div>
          );
        } else if (part.toLowerCase() === '\$\{gallery\}') {
          if (galleryImages.length === 0) return null;
          return (
            <div key={index} className="not-prose columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 my-8 w-full">
              {galleryImages.map((img: any) => (
                <div key={img.id} className="relative group overflow-hidden rounded-2xl break-inside-avoid shadow-sm hover:shadow-lg transition-shadow">
                  <img src={img.imageUrl} alt={img.caption || 'Gallery Image'} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-[14px] font-medium tracking-wide">{img.caption}</p>
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
            <div key={index} className={`not-prose my-8 p-8 md:p-12 w-full ${styles.card}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left w-full">
                <div>
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'classic' || templateType === 'modern' ? { color: themeColor } : {}}>Contact Us</h3>
                  <div className="space-y-6 mt-8">
                    {address && (
                      <div className="flex items-start gap-4 group">
                        <span className="text-2xl mt-1" style={{ color: themeColor || 'inherit' }}>📍</span>
                        <p className={styles.desc + " !mb-0 group-hover:text-gray-900 transition-colors"}>{address}</p>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-4 group">
                        <span className="text-2xl" style={{ color: themeColor || 'inherit' }}>📞</span>
                        <a href={`tel:${phone}`} className={styles.desc + " !mb-0 group-hover:text-gray-900 transition-colors"}>{phone}</a>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-4 group">
                        <span className="text-2xl" style={{ color: themeColor || 'inherit' }}>✉️</span>
                        <a href={`mailto:${email}`} className={styles.desc + " !mb-0 group-hover:text-gray-900 transition-colors"}>{email}</a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-10 pt-10 border-t border-gray-200">
                    <h4 className="font-bold mb-6 uppercase tracking-widest text-[13px] text-gray-500">Business Hours</h4>
                    <div className="space-y-3">
                      {hours && days.map(day => {
                        const h = hours[day];
                        return (
                          <div key={day} className="flex justify-between text-[14px]">
                            <span className="capitalize text-gray-500 font-medium">{day}</span>
                            <span className="font-bold text-gray-900">{h ? `${h.open} - ${h.close}` : 'Closed'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {address && (
                  <div className="rounded-2xl overflow-hidden shadow-sm h-64 md:h-full min-h-[350px] border border-gray-100 relative">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      className="absolute inset-0"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          // If the text is raw HTML (e.g. from the custom page editor) 
          // we render it. But we ensure that if it's just raw text, it flows properly.
          // By default, prose handles paragraphs. If there are no tags, we wrap it in a <p> tag.
          let rawHtml = part.trim();
          if (rawHtml && !rawHtml.startsWith('<')) {
            rawHtml = `<p>${rawHtml.replace(/\n/g, '<br />')}</p>`;
          }
          return <div key={index} className="w-full" dangerouslySetInnerHTML={{ __html: rawHtml }} />;
        }
      })}
    </div>
  );
}


