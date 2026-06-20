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
  if ((shopId === 'missouri-city' || shopId === 'sugarland') && process.env.DEMO_SHOP_ID) {
  shop = await prisma.shop.findFirst({
  where: { id: process.env.DEMO_SHOP_ID },
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

 // ── All colors configurable from admin console ──
 const themeBg      = c.widgetBgColor      || (isDark ? '#1a1a1f' : '#ffffff');
 const themeSurface = c.widgetSurfaceColor  || (isDark ? '#222228' : '#f8f8fa');
 const themeText    = c.widgetTextColor     || (isDark ? '#e8e8ec' : '#1f2937');
 const themeMuted   = c.widgetMutedColor    || (isDark ? '#9898a0' : '#6b7280');
 const themeBorder  = c.widgetBorderColor   || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');
 const themeInputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
 const primaryColor = themeColor || c.widgetHeaderColor || c.primaryColor || '#000000';
 const actualSecondaryColor = secondaryColor || c.secondaryColor || '#6b7280';

 return (
  <div className="h-full w-full bg-crm-bg flex flex-col relative overflow-y-auto font-body" style={{ backgroundColor: themeBg, color: themeText }}>
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }

   ${isDark ? `
   /* ── Dark mode: exact match with chat widget ── */
   body { background-color: ${themeBg} !important; color: ${themeText} !important; }
   .bg-crm-bg, .bg-white { background-color: ${themeBg} !important; }
   .bg-crm-surface { background-color: ${themeSurface} !important; }
   .text-crm-text, .text-gray-900 { color: ${themeText} !important; }
   .text-crm-muted, .text-gray-400, .text-gray-500 { color: ${themeMuted} !important; }
   .border-crm-border, .border-gray-100, .border-gray-200 { border-color: ${themeBorder} !important; }
   .bg-gray-50, .bg-gray-100, .bg-gray-200 { background-color: ${themeSurface} !important; }
   ` : `
   /* ── Light mode ── */
   .bg-crm-surface, .bg-crm-bg { background-color: ${primaryColor}08 !important; }
   .border-crm-border { border-color: ${primaryColor}30 !important; }
   .text-crm-muted { color: ${primaryColor}90 !important; }
   `}

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

   /* ── Card & button borders ── */
   button.border { border-color: ${themeBorder} !important; }
   button.border:hover { border-color: ${primaryColor} !important; background-color: ${isDark ? 'rgba(255,255,255,0.06)' : `${primaryColor}0A`} !important; }
   
   /* Progress dots */
   div[class*="h-1.5"][class*="rounded-full"] { opacity: 1 !important; }
   
   /* ── Input fields: configurable from admin ── */
   input, textarea { ${isDark ? `background-color: ${c.widgetInputBg || themeInputBg} !important; color: ${themeText} !important; border-color: ${themeBorder} !important;` : ''} }
   input:focus, textarea:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 2px ${primaryColor}33 !important; }
   input::placeholder, textarea::placeholder { color: ${themeMuted} !important; }

   /* Scroll area */
   .custom-scrollbar { background-color: transparent !important; }

   ${isDark ? `
   /* Selected card text on colored bg */
   button[style*="background-color"] { color: #ffffff !important; }
   .animate-spin { border-color: transparent !important; border-bottom-color: ${themeText} !important; }
   
   /* ── DayPicker calendar ── */
   .rdp { color: ${themeText}; }
   .rdp-months { background-color: transparent; }
   .rdp-caption_label { color: ${themeText} !important; }
   .rdp-head_cell { color: ${themeMuted} !important; }
   .rdp-cell { color: ${themeText}; }
   .rdp-day { color: ${themeText} !important; border-radius: 8px; }
   .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_disabled) { background-color: ${themeSurface} !important; }
   .rdp-day_selected { background-color: ${primaryColor} !important; color: #fff !important; }
   .rdp-day_today:not(.rdp-day_selected) { border: 1px solid ${primaryColor}60; }
   .rdp-day_disabled { color: rgba(255,255,255,0.15) !important; }
   .rdp-nav_button { color: ${themeText} !important; }
   .rdp-nav_button:hover { background-color: ${themeSurface} !important; }
   .rdp-button:focus-visible { outline-color: ${primaryColor}; }

   /* Error state */
   .bg-red-50 { background-color: rgba(239, 68, 68, 0.1) !important; }
   .text-red-700 { color: #fca5a5 !important; }
   .border-red-100 { border-color: rgba(239, 68, 68, 0.2) !important; }
   ` : ''}
   `}} />
   <BookingWizard shopId={actualShopId} themeColor={primaryColor} secondaryColor={actualSecondaryColor} templateType={templateType} currency={shop?.currency || 'INR'} shopType={(shop as any)?.shopType || 'PHYSICAL'} />
  </div>
 );
}
