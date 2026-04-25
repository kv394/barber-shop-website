const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rewrite CustomPageContent to include team, gallery, and contact
const oldFnStart = 'function CustomPageContent({';
const oldFnEnd = 'export default function ClientPage';

const startIdx = content.indexOf(oldFnStart);
const endIdx = content.indexOf(oldFnEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find CustomPageContent bounds.");
  process.exit(1);
}

const newFn = `function CustomPageContent({ content, shop, themeColor, className, onBookClick, reviews = [], templateType = 'modern' }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void, reviews?: any[], templateType?: string }) {
  if (!content) return null;
  const parts = content.split(/(\\$\\{products\\}|\\$\\{services\\}|\\$\\{reviews\\}|\\$\\{team\\}|\\$\\{gallery\\}|\\$\\{contact\\})/gi);
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
        if (part.toLowerCase() === '\\$\\{products\\}') {
          if (sellableProducts.length === 0) return null;
          return (
            <div key={index} className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 font-sans">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className={styles.card}>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4 shadow-sm" />
                  )}
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className={styles.desc}>{product.description}</p>
                  <div className={styles.price} style={templateType === 'corporate' || templateType === 'modern' ? { color: themeColor } : {}}>
                    \\$\\{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                  </div>
                </div>
              ))}
            </div>
          );
        } else if (part.toLowerCase() === '\\$\\{services\\}') {
          if (services.length === 0) return null;
          return (
            <div key={index} className={\`not-prose grid gap-6 my-8 font-sans \${templateType === 'minimal' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}\`}>
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
                              <span className={styles.price}>\\$\\{service.price.toFixed(2)}</span>
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
                          <div className={styles.price} style={templateType === 'modern' ? { backgroundColor: \`\${themeColor || '#ffffff'}20\`, color: themeColor || '#ffffff' } : (templateType === 'corporate' ? { color: themeColor } : {})}>
                            \\$\\{service.price.toFixed(2)} {templateType === 'classic' && \` • \${service.duration} MINS\`}
                          </div>
                        </div>
        
                        {service.description && (
                          <p className={styles.desc}>{service.description}</p>
                        )}
        
                        <div className="mt-auto">
                          {templateType !== 'classic' && (
                            <div className={\`text-[12px] opacity-70 mb-4 \${templateType === 'sporty' ? 'border-t border-current/10 pt-4 uppercase tracking-widest font-bold' : ''}\`}>
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
        } else if (part.toLowerCase() === '\\$\\{reviews\\}') {
          return (
            <div key={index} className="not-prose w-full">
               <InteractiveReviewsSection shopId={shop.id} initialReviews={reviews} themeColor={themeColor} />
            </div>
          );
        } else if (part.toLowerCase() === '\\$\\{team\\}') {
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
        } else if (part.toLowerCase() === '\\$\\{gallery\\}') {
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
        } else if (part.toLowerCase() === '\\$\\{contact\\}') {
          const address = shop.customization?.address;
          const phone = shop.customization?.phone;
          const email = shop.customization?.email;
          const hours = shop.customization?.businessHours;
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

          return (
            <div key={index} className={\`not-prose my-8 p-8 md:p-12 \${styles.card}\`}>
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
                        <a href={\`tel:\${phone}\`} className={styles.desc}>{phone}</a>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-4">
                        <span className="text-xl" style={{ color: themeColor || 'inherit' }}>✉️</span>
                        <a href={\`mailto:\${email}\`} className={styles.desc}>{email}</a>
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
                            <span className="font-medium">{h ? \`\${h.open} - \${h.close}\` : 'Closed'}</span>
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
                      src={\`https://www.google.com/maps?q=\${encodeURIComponent(address)}&output=embed\`}
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
`;

content = content.substring(0, startIdx) + newFn + '\n\n' + content.substring(endIdx);

fs.writeFileSync(file, content);
console.log('Successfully updated dynamic tags');
