const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const customComponent = `function CustomPageContent({ content, shop, themeColor, className }: { content: string, shop: any, themeColor?: string, className?: string }) {
  if (!content) return null;
  const parts = content.split('\\x24{products}');
  if (parts.length === 1) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const sellableProducts = shop.products?.filter((product: any) => product.isSellable !== false) || [];

  return (
    <div className={className}>
      {parts.map((part, index) => (
        <div key={index}>
          <div dangerouslySetInnerHTML={{ __html: part }} />
          {index < parts.length - 1 && sellableProducts.length > 0 && (
            <div className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 font-sans">
              {sellableProducts.map((product: any) => (
                <div key={product.id} className="border border-crm-border p-6 rounded-xl bg-crm-surface shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <h3 className="font-bold text-lg mb-2" style={themeColor ? { color: themeColor } : {}}>{product.name}</h3>
                  <p className="text-crm-muted text-[13px] mb-4 flex-grow">{product.description}</p>
                  <div className="font-bold text-crm-text">\\x24{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ClientPage`;

content = content.replace('export default function ClientPage', customComponent);

content = content.replace(
  /<div className="prose prose-lg max-w-none text-crm-text" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
  (match, offset, string) => {
    const before = string.slice(offset - 200, offset);
    if (before.includes('sportRed')) {
        return '<CustomPageContent content={p.content || ""} shop={shop} themeColor={sportRed} className="prose prose-lg max-w-none text-crm-text" />';
    } else {
        return '<CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-crm-text" />';
    }
  }
);

const replacements = [
  [
    /<div className="prose prose-invert prose-lg max-w-none text-crm-muted font-sans" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-crm-muted font-sans" />'
  ],
  [
    /<div className="prose prose-invert prose-lg max-w-none text-purple-200\/80" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-purple-200/80" />'
  ],
  [
    /<div className="prose prose-invert prose-lg max-w-none font-body text-\[#d0c5af\]" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none font-body text-[#d0c5af]" />'
  ],
  [
    /<div className="prose prose-lg max-w-none text-crm-muted" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-crm-muted" />'
  ],
  [
    /<div className="prose prose-lg max-w-none text-\[#5a4634\]" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-[#5a4634]" />'
  ],
  [
    /<div className="prose prose-invert prose-lg max-w-none text-crm-muted" dangerouslySetInnerHTML={{ __html: p\.content \|\| '' }} \/>/g,
    '<CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none text-crm-muted" />'
  ]
];

replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

fs.writeFileSync(file, content);
console.log('Update complete');