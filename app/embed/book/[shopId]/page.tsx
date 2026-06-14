import Image from 'next/image';
import BookingWizard from '@/components/booking/BookingWizard';
import { prisma } from '@/lib/prisma';

export default async function EmbedBookPage({ params, searchParams }: { params: Promise<{ shopId: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
 const { shopId } = await params;
 const sp = searchParams ? await searchParams : {};
 const themeColor = typeof sp.themeColor === 'string' ? sp.themeColor : undefined;
 const secondaryColor = typeof sp.secondaryColor === 'string' ? sp.secondaryColor : undefined;
 const templateType = typeof sp.templateType === 'string' ? sp.templateType : undefined;
 const qHeadingFont = typeof sp.headingFont === 'string' ? sp.headingFont : undefined;
 const qBodyFont = typeof sp.bodyFont === 'string' ? sp.bodyFont : undefined;
 const qColorTheme = typeof sp.colorTheme === 'string' ? sp.colorTheme : undefined;

 let shop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: shopId },
 { subdomain: shopId },
 { companyName: shopId }
 ]
 },
 select: { id: true, customization: true, currency: true, shopType: true }
 });

 if (!shop) {
 const firstWord = shopId.split('-').find(w => w.length > 2) || shopId.split('-')[0];
 const candidates = await prisma.shop.findMany({
 where: { name: { contains: firstWord, mode: 'insensitive' } },
 take: 50,
 select: { id: true, name: true, customization: true, currency: true, shopType: true }
 });

 shop = candidates.find(
 (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopId.toLowerCase()
 ) || null;
 }

 if (!shop) {
 if (shopId === 'missouri-city' || shopId === 'sugarland') {
 shop = await prisma.shop.findFirst({
 where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
 select: { id: true, customization: true, currency: true, shopType: true }
 });
 }
 }

 const actualShopId = shop?.id || shopId;
 const c = (shop?.customization as any) || {};
 const headingFont = qHeadingFont || c.headingFont || c.fontFamily || 'Inter';
 const bodyFont = qBodyFont || c.bodyFont || c.fontFamily || 'Inter';
 const buttonShape = c.buttonShape || 'rounded';
 const buttonVariant = c.buttonVariant || 'solid';
 const colorTheme = qColorTheme || c.colorTheme || 'light';
 const isDark = colorTheme === 'dark';
 const themeBg = isDark ? '#121212' : '#ffffff';
 const themeText = isDark ? '#ffffff' : '#111827';
 const themeMuted = isDark ? '#a1a1aa' : '#6b7280';
 const themeBorder = isDark ? '#27272a' : '#e5e7eb';
 const primaryColor = themeColor || c.primaryColor || '#000000';
 const actualSecondaryColor = secondaryColor || c.secondaryColor || '#6b7280';

 return (
  <div className="h-full w-full bg-crm-bg flex flex-col relative overflow-y-auto font-body" style={{ backgroundColor: themeBg, color: themeText }}>
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
      ${isDark ? `
    .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
    .text-crm-text, .text-gray-900, .text-crm-text { color: ${themeText} !important; }
    .text-crm-muted, .text-gray-500, .text-crm-muted { color: ${themeMuted} !important; }
    .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
    .text-gray-400 { color: ${themeMuted} !important; }
    .bg-gray-50, .bg-gray-100 { background-color: #1e1e24 !important; }
    ` : ''}

    ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
    ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
    
    ${buttonVariant === 'outline' ? `
    .btn, button.bg-crm-primary, button[style*="background-color: ${primaryColor}"] { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
    .btn:hover, button.bg-crm-primary:hover, button[style*="background-color: ${primaryColor}"]:hover { background-color: ${primaryColor}20 !important; }
    ` : ''}
    
    ${buttonVariant === 'ghost' ? `
    .btn, button.bg-crm-primary, button[style*="background-color: ${primaryColor}"] { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
    .btn:hover, button.bg-crm-primary:hover, button[style*="background-color: ${primaryColor}"]:hover { background-color: ${primaryColor}20 !important; }
    ` : ''}

    /* ===== Theme Color Overrides ===== */
    ${isDark ? `
    /* Dark mode: solid backgrounds with very subtle theme tint */
    .bg-crm-surface { background-color: #1a1a20 !important; }
    .bg-crm-bg { background-color: ${themeBg} !important; }
    ` : `
    /* Light mode: warm background tint */
    .bg-crm-surface, .bg-crm-bg { background-color: ${primaryColor}08 !important; }
    `}
    
    /* Header bar with theme accent */
    .border-crm-border { border-color: ${isDark ? themeBorder : `${primaryColor}30`} !important; }
    
    /* All card borders get subtle theme tint */
    button.border { border-color: ${isDark ? themeBorder : `${primaryColor}35`} !important; }
    button.border:hover { border-color: ${primaryColor} !important; background-color: ${isDark ? '#262630' : `${primaryColor}0A`} !important; }
    
    /* Progress indicator dots - more visible */
    div[class*="h-1.5"][class*="rounded-full"] { opacity: 1 !important; }
    
    /* Input fields */
    input, textarea { ${isDark ? `background-color: #1e1e24 !important; color: ${themeText} !important; border-color: ${themeBorder} !important;` : ''} }
    input:focus, textarea:focus { border-color: ${primaryColor} !important; box-shadow: 0 1px 0 0 ${primaryColor} !important; }
    input::placeholder, textarea::placeholder { color: ${isDark ? '#71717a' : '#9ca3af'} !important; }
    
    /* Muted text */
    .text-crm-muted { color: ${isDark ? themeMuted : `${primaryColor}90`} !important; }

    /* Scroll area background */
    .custom-scrollbar { background-color: transparent !important; }

    /* Selected/active card state */
    ${isDark ? `
    button[style*="background-color"] { color: ${themeText} !important; }
    .animate-spin { border-color: transparent !important; border-bottom-color: ${themeText} !important; }
    
    /* DayPicker calendar dark mode */
    .rdp { color: ${themeText}; }
    .rdp-months { background-color: transparent; }
    .rdp-caption_label { color: ${themeText} !important; }
    .rdp-head_cell { color: ${themeMuted} !important; }
    .rdp-cell { color: ${themeText}; }
    .rdp-day { color: ${themeText} !important; border-radius: 8px; }
    .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) { background-color: #262630 !important; }
    .rdp-day_selected { background-color: ${primaryColor} !important; color: #fff !important; }
    .rdp-day_today:not(.rdp-day_selected) { border: 1px solid ${primaryColor}60; }
    .rdp-day_disabled { color: #3f3f46 !important; }
    .rdp-nav_button { color: ${themeText} !important; }
    .rdp-nav_button:hover { background-color: #262630 !important; }
    .rdp-button:focus-visible { outline-color: ${primaryColor}; }

    /* Error state in dark */
    .bg-red-50 { background-color: rgba(239, 68, 68, 0.1) !important; }
    .text-red-700 { color: #fca5a5 !important; }
    .border-red-100 { border-color: rgba(239, 68, 68, 0.2) !important; }

    /* Toggle buttons */
    .bg-gray-200 { background-color: #27272a !important; }
    
    /* Overall body */
    body { background-color: ${themeBg} !important; color: ${themeText} !important; }
    ` : ''}
    `}} />
   <BookingWizard shopId={actualShopId} themeColor={primaryColor} secondaryColor={actualSecondaryColor} templateType={templateType} currency={shop?.currency || 'INR'} shopType={(shop as any)?.shopType || 'PHYSICAL'} />
  </div>
 );
}
