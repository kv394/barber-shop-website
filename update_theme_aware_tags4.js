const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the CustomPageContent bounds
const oldFnStart = 'function CustomPageContent({ content, shop, themeColor, className, onBookClick, reviews = [] }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void, reviews?: any[] }) {';
const oldFnEnd = 'export default function ClientPage';

const startIdx = content.indexOf(oldFnStart);
const endIdx = content.indexOf(oldFnEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find CustomPageContent bounds.");
  process.exit(1);
}

const newFn = `function CustomPageContent({ content, shop, themeColor, className, onBookClick, reviews = [], templateType = 'modern' }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void, reviews?: any[], templateType?: string }) {
  if (!content) return null;
  const parts = content.split(/(\\$\\{products\\}|\\$\\{services\\}|\\$\\{reviews\\})/gi);
  if (parts.length === 1) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const sellableProducts = shop.products?.filter((product: any) => product.isSellable !== false) || [];
  const services = shop.services || [];

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
                          <button onClick={() => onBookClick && onBookClick(service)} className={styles.btn} style={styles.btnStyle}>Book</button>
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
                            {templateType === 'sporty' || templateType === 'editorial' ? 'Book This' : 'Book'}
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
        } else {
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        }
      })}
    </div>
  );
}

`;

content = content.substring(0, startIdx) + newFn + content.substring(endIdx);

fs.writeFileSync(file, content);
console.log('Updated CustomPageContent completely');
