const fs = require('fs');

const files = [
  'app/shops/[slug]/ClientPage.tsx',
  'app/shop-template/[slug]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // Add defaults for new properties at the top of the component
  const defaults = `
    const c = shop.customization || {};
    const headingFont = c.headingFont || c.fontFamily || 'Inter';
    const bodyFont = c.bodyFont || c.fontFamily || 'Inter';
    const buttonShape = c.buttonShape || 'rounded';
    const buttonVariant = c.buttonVariant || 'solid';
    const colorTheme = c.colorTheme || 'light';
    const headerStyle = c.headerStyle || 'classic';
    const heroLayout = c.heroLayout || 'full';
    const heroOverlayOpacity = c.heroOverlayOpacity !== undefined ? c.heroOverlayOpacity : 0;
    const heroOverlayColor = c.heroOverlayColor || '#000000';
    const enableScrollAnimations = c.enableScrollAnimations || false;
    const faviconUrl = c.faviconUrl || null;
    const customCss = c.customCss || '';
    const sectionOrder = c.sectionOrder || ['hero', 'services', 'team', 'gallery', 'reviews', 'contact'];

    // Helper for button styles
    const getButtonStyle = (bg, text) => {
      let base = "transition-all font-bold text-[13px] px-6 py-3 cursor-pointer ";
      if (buttonShape === 'sharp') base += "rounded-none ";
      else if (buttonShape === 'pill') base += "rounded-full ";
      else base += "rounded-lg "; // default rounded

      let style = {};
      if (buttonVariant === 'outline') {
        base += "border-2 bg-transparent hover:bg-opacity-10 ";
        style = { borderColor: bg, color: bg };
      } else if (buttonVariant === 'ghost') {
        base += "bg-transparent hover:bg-opacity-10 ";
        style = { color: bg };
      } else {
        // solid
        base += "border border-transparent ";
        style = { backgroundColor: bg, color: text || '#ffffff' };
      }
      return { className: base, style };
    };

    // Helper for dark mode overrides
    const isDark = colorTheme === 'dark';
    const themeBg = isDark ? '#0f172a' : '#ffffff';
    const themeText = isDark ? '#f8fafc' : '#111827';
    const themeMuted = isDark ? '#94a3b8' : '#6b7280';
    const themeBorder = isDark ? '#1e293b' : '#e5e7eb';
  `;

  content = content.replace(
    /const c = shop\.customization \|\| \{\};/,
    defaults.replace('const c = shop.customization || {};', 'const c = shop.customization || {};')
  );

  // We need to inject <style> tags and optionally favicon
  // Look for `return (` and inject our stuff
  const styleInjection = `
        {faviconUrl && (
          <head>
            <link rel="icon" href={faviconUrl} />
          </head>
        )}
        <style dangerouslySetInnerHTML={{__html: \`
          @import url('https://fonts.googleapis.com/css2?family=\${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=\${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
          
          .font-heading { font-family: '\${headingFont}', sans-serif !important; }
          .font-body { font-family: '\${bodyFont}', sans-serif !important; }
          
          /* Custom CSS */
          \${customCss}

          /* Theme Overrides */
          \${isDark ? \`
            .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: \${themeBg} !important; border-color: \${themeBorder} !important; }
            .text-crm-text, .text-gray-900, .text-black { color: \${themeText} !important; }
            .text-crm-muted, .text-gray-500, .text-gray-600 { color: \${themeMuted} !important; }
            .border-gray-100, .border-gray-200, .border-crm-border { border-color: \${themeBorder} !important; }
          \` : ''}

          /* Scroll Animations */
          \${enableScrollAnimations ? \`
            .animate-on-scroll {
              opacity: 0;
              transform: translateY(20px);
              animation: fadeInUp 0.8s ease forwards;
              animation-play-state: paused;
            }
            @keyframes fadeInUp {
              to { opacity: 1; transform: translateY(0); }
            }
            /* A quick hack for CSS only scroll animations using intersection observer in JS normally, but we can do a delayed load for now */
            .animate-on-scroll { animation-play-state: running; }
          \` : ''}
        \`}} />
  `;

  content = content.replace(
    /<main className=\"([^\"]+)\"[^>]*>/g,
    (match) => match + styleInjection
  );

  // We need to update heroOverlayOpacity and Color where hero is rendered
  content = content.replace(
    /className=\{\(heroImageUrl \|\| heroVideoUrl\) \? \"absolute inset-0 bg-crm-surface\/70 z-0\" : \"z-0\"\}/g,
    \`className={(heroImageUrl || heroVideoUrl) ? "absolute inset-0 z-0" : "z-0"} style={(heroImageUrl || heroVideoUrl) ? { backgroundColor: heroOverlayColor, opacity: heroOverlayOpacity / 100 } : {}}\`
  );

  // We need to update fonts. In many places font-sans is used, but we can globally apply font-body and font-heading to elements.
  // We already added !important to font-heading and font-body in the style tag. So we can just add these classes to main wrapper.
  content = content.replace(
    /<main className=\"([^\"]+)\"/g,
    '<main className=\"$1 font-body\"'
  );

  // Add font-heading to h1, h2, h3, h4
  content = content.replace(
    /<h([1-6]) className=\"([^\"]+)\"/g,
    '<h$1 className=\"$2 font-heading\"'
  );

  fs.writeFileSync(file, content);
  console.log(`Updated styles in ${file}`);
}
