const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update CustomPageContent definition
const oldFunctionStart = 'function CustomPageContent({ content, shop, themeColor, className }: { content: string, shop: any, themeColor?: string, className?: string }) {';
const oldFunctionRegex = new RegExp(oldFunctionStart.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&') + '[\\\\s\\\\S]*?(?=export default function ClientPage)', 'g');

const newFunction = `function CustomPageContent({ content, shop, themeColor, className, onBookClick }: { content: string, shop: any, themeColor?: string, className?: string, onBookClick?: (service: any) => void }) {
  if (!content) return null;
  const parts = content.split(/(\\$\\{products\\}|\\$\\{Services\\})/gi);
  if (parts.length === 1) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const sellableProducts = shop.products?.filter((product: any) => product.isSellable !== false) || [];
  const services = shop.services || [];

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.toLowerCase() === '\\$\\{products\\}') {
          if (sellableProducts.length === 0) return null;
          return (
            <div key={index} className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 font-sans">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className="border border-crm-border p-6 rounded-xl bg-crm-surface shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="font-bold text-lg mb-2" style={themeColor ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className="text-crm-muted text-[13px] mb-4 flex-grow">{product.description}</p>
                  <div className="font-bold text-crm-text">\\${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</div>
                </div>
              ))}
            </div>
          );
        } else if (part.toLowerCase() === '\\$\\{services\\}') {
          if (services.length === 0) return null;
          return (
            <div key={index} className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 font-sans">
                {services.map((service: any) => (
                  <div
                    key={service.id}
                    className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-crm-border shadow-sm transition-all duration-300 hover:shadow-lg flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-crm-text transition-colors text-lg font-bold">
                        {service.name}
                      </h3>
                      <div 
                        className="px-3 py-1 rounded-full text-[13px] font-semibold"
                        style={{ backgroundColor: \`\\$\\{themeColor || '#1f2937'\\}20\`, color: themeColor || '#1f2937' }}
                      >
                        \\$\\{service.price.toFixed(2)\\}
                      </div>
                    </div>
    
                    {service.description && (
                      <p className="text-crm-muted mb-4 leading-relaxed flex-grow text-[13px]">
                        {service.description}
                      </p>
                    )}
    
                    <div className="flex items-center justify-between pt-4 border-t border-crm-border mt-auto">
                      <div className="text-crm-muted text-[13px]">
                        ⏱️ {service.duration} minutes
                      </div>
                      <button
                        onClick={() => onBookClick && onBookClick(service)}
                        className="text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-[13px]"
                        style={{ backgroundColor: themeColor || '#1f2937' }}
                      >
                        Book
                      </button>                    </div>
                  </div>
                ))}
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

content = content.replace(oldFunctionRegex, newFunction);

// 2. Add onBookClick={handleBookClick} to all <CustomPageContent ... />
content = content.replace(/<CustomPageContent([^>]+)\/>/g, '<CustomPageContent$1 onBookClick={handleBookClick} />');

fs.writeFileSync(file, content);
console.log('Done custom page component update');
