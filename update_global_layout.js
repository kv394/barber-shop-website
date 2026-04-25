const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract values in the component
content = content.replace(
  'const { businessHours, pages = [] } = c;',
  'const { businessHours, pages = [], fontFamily = "Inter", ctaText = "Book", announcement, heroVideoUrl } = c;'
);

// 2. Inject Google Fonts and styling globally for the main wrapper.
// Also add the announcement banner at the very top.
const mainReplacementRegex = /export default function ClientPage[^]+?return \(\s*<>/;

if (content.match(mainReplacementRegex)) {
  const replacement = `export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed, reviews = [], dynamicTemplateHtml, dynamicTemplateCss }: any) {
  const [selectedService, setSelectedService] = useState<any>(null);

  const handleBookClick = (service: any) => {
    setSelectedService(service || shop.services?.[0] || null);
  };

  const c = shop.customization || {};
  const { businessHours, pages = [], fontFamily = 'Inter', ctaText = 'Book', announcement, heroVideoUrl } = c;
  const logoUrl = c.logoUrl;
  const heroImageUrl = c.heroImageUrl || c.bannerUrl || null;
  const shopPhone = c.phone || shop.phone;
  const shopEmail = c.email || shop.email;
  const shopAddress = c.address;

  // Auth button for client sign-in/out
  const authButton = (
      <div className="absolute top-6 right-6 z-50">
          <SupabaseAuthButton redirectUrl={usePathname()} />
      </div>
  );

  const fontUrl = \`https://fonts.googleapis.com/css2?family=\${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap\`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: \`
        @import url('\${fontUrl}');
        .custom-font-override { font-family: '\${fontFamily}', sans-serif !important; }
      \`}} />
      <div className="custom-font-override relative min-h-screen">
        {announcement?.isActive && announcement?.text && (
          <div className="w-full bg-crm-text text-crm-surface px-4 py-2 text-center text-[13px] font-bold tracking-wide z-[100] relative flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: '#fff' }}>
            <span>{announcement.text}</span>
            {announcement.url && (
              <a href={announcement.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 transition-opacity">Learn More &rarr;</a>
            )}
          </div>
        )}`;
  content = content.replace(mainReplacementRegex, replacement);
  // Add closing div to the end
  content = content.replace(/<\/>\s*$/g, '</div>\n    </>\n');
}

// 3. Helper to replace hero background to handle heroVideoUrl
// The template blocks are hard to regex exactly, but we can replace `backgroundImage: heroImageUrl ? \`url(\${heroImageUrl})\` : undefined` 
// with a check for video.

// Instead of massive regex, I will just do a simple string replace for the generic pattern where possible, or just note that the video is handled in the `heroVideoUrl` custom tags.
// Actually, it's easier to just find the heroImageUrl logic in the specific templates.
// For modern template:
content = content.replace(
  /<section className="bg-crm-surface relative bg-cover bg-center"[^>]+>.*?<div className=\{heroImageUrl \? "absolute inset-0 bg-crm-surface\/70" : ""\} \/>/s,
  `<section className="bg-crm-surface relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: heroImageUrl && !heroVideoUrl ? \`url(\${heroImageUrl})\` : undefined }}>
        {heroVideoUrl && (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        )}
        <div className={(heroImageUrl || heroVideoUrl) ? "absolute inset-0 bg-crm-surface/70 z-0" : "z-0"} />`
);

fs.writeFileSync(file, content);
console.log('Added global font, announcement, and video hero support');
