const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexCustom = /function CustomPageContent\(\{([\s\S]*?)\}\s*\{/;
const matchCustom = content.match(regexCustom);

if (!content.includes('const [selectedProduct, setSelectedProduct] = useState<any>(null);')) {
  // Insert useState
  content = content.replace(
    'if (!content) return null;',
    'const [selectedProduct, setSelectedProduct] = useState<any>(null);\n  if (!content) return null;'
  );
}

// Replace product card
const productGridRegex = /<div key=\{index\} className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 font-sans">[\s\S]*?<\/div>\s*\);\s*\} else if \(part\.toLowerCase\(\) === '\\\$\\{services\\}'\)/;

const newProductGrid = `<div key={index} className="not-prose font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className={styles.card}>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4 shadow-sm cursor-pointer" onClick={() => setSelectedProduct(product)} />
                  )}
                  <h3 className={styles.title} style={templateType === 'corporate' || templateType === 'sporty' || templateType === 'classic' ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className={styles.desc + " line-clamp-3 cursor-pointer"} onClick={() => setSelectedProduct(product)} title="Click to read more">{product.description}</p>
                  <div className={styles.price} style={templateType === 'corporate' || templateType === 'modern' ? { color: themeColor } : {}}>
                    \$\\{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
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
                      \$\\{typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : '0.00'}
                    </div>
                    <div className="prose prose-sm max-w-none text-crm-muted mb-8">
                      {selectedProduct.description?.split('\\n').map((line: string, i: number) => (
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
        } else if (part.toLowerCase() === '\\\$\\{services\\}')`;

content = content.replace(productGridRegex, newProductGrid);

fs.writeFileSync(file, content);
console.log('Fixed product display and added modal');
