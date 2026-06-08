import Image from 'next/image';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { Metadata } from 'next';
import ClientPage from './ClientPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrCreateFolder, downloadFileFromFolder } from '@/lib/google-drive';
import { cacheService } from '@/lib/cache';
import AIWidget from '@/components/booking/AIWidget';
import BookingModalScript from '@/components/booking/BookingModalScript';
import { serialize } from '@/lib/serialize';

// Use this to ensure the page caches effectively unless revalidated

const serviceInclude = {
 services: {
 where: { type: 'CUSTOMER' as const, isBookable: true },
 orderBy: { createdAt: 'desc' as const },
 select: { id: true, name: true, description: true, price: true, duration: true, imageUrl: true },
 },
 products: {
 where: { type: 'RETAIL' as const, isSellable: true },
 select: { id: true, name: true, description: true, price: true, imageUrl: true },
 },
 portfolioImages: {
 select: { id: true, imageUrl: true, caption: true },
 },
 users: {
 where: { role: { in: ['STAFF', 'SHOP_ADMIN', 'BOOTH_RENTER'] as UserRole[] } },
 select: { id: true, name: true, imageUrl: true, role: true, shopClients: { select: { clientNotes: true } } }, // using clientNotes temporarily for bio if any, or just name/role
 },
};

const getShopBySlug = cache(async (slug: string) => {
 return await cacheService.getOrSet(
 `shop_public_page_data:${slug}`,
 async () => {
 // 1. Try to find by exact ID (backward compat)
 let shop: any = await prisma.shop.findUnique({
 where: { id: slug },
 include: serviceInclude,
 });

 if (!shop) {
 // 2. Case-insensitive name search — avoids loading ALL shops into memory.
 const firstWord = slug.split('-').find(w => w.length > 2) || slug.split('-')[0];
 const candidates = await prisma.shop.findMany({
 where: { name: { contains: firstWord, mode: 'insensitive' } },
 include: serviceInclude,
 take: 50, // Bounded — never fetches entire table
 });

 shop = candidates.find(
 (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
 ) || null;

  // When multiple shops share the same slug (duplicate names), prefer
  // the one that has a custom template with actual HTML content.
  if (shop) {
   const allMatches = candidates.filter(
    (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
   );
   if (allMatches.length > 1) {
    const customMatch = allMatches.find(
     (s: any) => s.template === 'custom' && s.customization?.customHtml
    );
    if (customMatch) shop = customMatch;
   }
  }
 }

 if (!shop) return null;

 // Fetch reviews for this shop
 const reviews = await prisma.review.findMany({
 where: { shopId: shop.id },
 include: {
 user: { select: { name: true } },
 appointment: {
 include: {
 service: { select: { name: true } },
 staff: { select: { name: true } },
 },
 },
 },
 orderBy: { createdAt: 'desc' },
 take: 20,
 });

 const serialized = serialize(shop);
 // SECURITY: Only expose public-facing customization fields to the client.
 // Internal settings like notifSettings, bookingSettings, businessHours are admin-only.
 const rawCustom = serialized.customization || {};
 
 // Format address if it's an object
 const rawAddress = rawCustom.address;
 const formattedAddress = typeof rawAddress === 'object' && rawAddress !== null
 ? [rawAddress.street, rawAddress.suite, rawAddress.city, rawAddress.state, rawAddress.zip, rawAddress.country].filter(Boolean).join(', ')
 : rawAddress;

 const publicCustomization = {
 primaryColor: rawCustom.primaryColor,
 secondaryColor: rawCustom.secondaryColor,
 logoUrl: rawCustom.logoUrl,
 bannerUrl: rawCustom.bannerUrl,
 heroImageUrl: rawCustom.heroImageUrl,
 tagline: rawCustom.tagline,
 address: formattedAddress,
 phone: rawCustom.phone,
 aboutText: rawCustom.aboutText,
 socialLinks: rawCustom.socialLinks,
 // Expose business hours for public schedule display
 businessHours: rawCustom.businessHours,
 pages: rawCustom.pages,
 editorialCustomization: rawCustom.editorialCustomization,
 fontFamily: rawCustom.fontFamily,
 ctaText: rawCustom.ctaText,
 heroVideoUrl: rawCustom.heroVideoUrl,
 announcement: rawCustom.announcement,
 seo: rawCustom.seo,
 customHtml: rawCustom.customHtml,
 authPosition: rawCustom.authPosition,
 chatbotPosition: rawCustom.chatbotPosition,
 colorTheme: rawCustom.colorTheme,
 };
 return {
 ...serialized,
 customization: publicCustomization,
 template: serialized.template || 'modern',
 reviews: serialize(reviews),
 };
 },
 900 // 15 minutes cache
 );
});

export async function generateMetadata({
 params,
}: {
 params: Promise<{ slug: string }>;
}): Promise<Metadata> {
 const { slug } = await params;
 const shop = await getShopBySlug(slug);

 if (!shop) {
 return {
 title: 'Shop Not Found',
 description: 'The shop you are looking for does not exist.',
 };
 }

 const seo = shop.customization?.seo || {};
 const title = seo.title || `${shop.name} - Services & Booking`;
 const description = seo.description || shop.description || `Book services at ${shop.name}`;
 const ogImageUrl = seo.ogImageUrl || shop.customization?.heroImageUrl || shop.customization?.logoUrl;

 return {
 title,
 description,
 openGraph: {
 title,
 description,
 images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
 },
 twitter: {
 card: 'summary_large_image',
 title,
 description,
 images: ogImageUrl ? [ogImageUrl] : undefined,
 },
 };
}

export default async function PublicShopPage({
 params,
 searchParams,
}: {
 params: Promise<{ slug: string }>;
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const { slug } = await params;
 const resolvedSearchParams = await searchParams;
 const isPreview = resolvedSearchParams?.preview === 'true';

   // In preview mode, bypass ALL caching (React cache + Redis).
   // This guarantees fresh data from the DB on every preview request.
   let shop;
   if (isPreview) {
    // Query DB directly — no Redis, no React cache
    let s: any = await prisma.shop.findUnique({ where: { id: slug }, include: serviceInclude });
    if (!s) {
     const firstWord = slug.split('-').find((w: string) => w.length > 2) || slug.split('-')[0];
     const candidates = await prisma.shop.findMany({
      where: { name: { contains: firstWord, mode: 'insensitive' } },
      include: serviceInclude,
      take: 50,
     });
      s = candidates.find(
       (c: any) => c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
      ) || null;
      // Prefer the shop with custom template when duplicates exist
      if (s) {
       const allMatches = candidates.filter(
        (c: any) => c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
       );
       if (allMatches.length > 1) {
        const customMatch = allMatches.find(
         (c: any) => c.template === 'custom' && c.customization?.customHtml
        );
        if (customMatch) s = customMatch;
       }
      }
     }
    if (s) {
     const reviews = await prisma.review.findMany({
      where: { shopId: s.id },
      include: { user: { select: { name: true } }, appointment: { include: { service: { select: { name: true } }, staff: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
     });
     const serialized = serialize(s);
     const rawCustom = serialized.customization || {};
     const rawAddress = rawCustom.address;
     const formattedAddress = typeof rawAddress === 'object' && rawAddress !== null
      ? [rawAddress.street, rawAddress.suite, rawAddress.city, rawAddress.state, rawAddress.zip, rawAddress.country].filter(Boolean).join(', ')
      : rawAddress;
     shop = {
      ...serialized,
      customization: {
       primaryColor: rawCustom.primaryColor, secondaryColor: rawCustom.secondaryColor,
       logoUrl: rawCustom.logoUrl, bannerUrl: rawCustom.bannerUrl, heroImageUrl: rawCustom.heroImageUrl,
       tagline: rawCustom.tagline, address: formattedAddress, phone: rawCustom.phone,
       aboutText: rawCustom.aboutText, socialLinks: rawCustom.socialLinks,
       businessHours: rawCustom.businessHours, pages: rawCustom.pages,
       editorialCustomization: rawCustom.editorialCustomization, fontFamily: rawCustom.fontFamily,
       ctaText: rawCustom.ctaText, heroVideoUrl: rawCustom.heroVideoUrl,
       announcement: rawCustom.announcement, seo: rawCustom.seo,
       customHtml: rawCustom.customHtml, authPosition: rawCustom.authPosition,
       chatbotPosition: rawCustom.chatbotPosition,
       colorTheme: rawCustom.colorTheme,
      },
      template: serialized.template || 'modern',
      reviews: serialize(reviews),
     };
     // Also flush the stale Redis cache so non-preview visits get fresh data too
     await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    } else {
     shop = null;
    }
   } else {
    shop = await getShopBySlug(slug);
   }

 if (!shop) {
 return (
 <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
 <div className="text-center">
 <h1 className="font-bold text-crm-text mb-4 text-2xl font-bold">Shop Not Found</h1>
 <p className="text-crm-muted text-[13px]">We couldn't find the shop you're looking for.</p>
 </div>
 </div>
 );
 }

 // Automatically redirect STAFF and ADMINS to their dashboard (the KutzApp base URL)
 // Only CLIENTS should be viewing the public shop landing page.
 if (!isPreview) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (user?.email) {
 const dbUser = await prisma.user.findUnique({
 where: { email: user.email },
 select: { role: true, shopId: true }
 });
 
 if (dbUser && dbUser.role !== 'CLIENT') {
 redirect('/');
 }
 }
 }

 // Use the custom colors if they exist, otherwise fallback to defaults
 const primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
 const secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
 const templateType = shop.template || 'modern';
 const sportRed = shop.customization?.primaryColor || '#d50000'; // Default to a strong red

 let dynamicTemplateHtml = null;
 let dynamicTemplateCss = null;

 if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType)) {

  // Helper to normalize Google Drive image URLs
  const normalizeImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  return url;
  };

  const shopForTemplate = {
  ...shop,
  logoUrl: normalizeImageUrl(shop.customization?.logoUrl) || shop.logoUrl,
  heroImageUrl: normalizeImageUrl(shop.customization?.heroImageUrl) || shop.heroImageUrl
  };

  // For 'custom' template type, use the shop's own customHtml (per-shop).
  // Route it through dynamicTemplateHtml so it renders via DynamicTemplate
  // component (which supports script execution for SDK) instead of the
  // iframe-based CustomTemplate.
  if (templateType === 'custom' && shop.customization?.customHtml) {
  try {
  const Handlebars = (await import('handlebars')).default;
  const compiledTemplate = Handlebars.compile(shop.customization.customHtml);
  dynamicTemplateHtml = compiledTemplate({
  ...shop.customization,
  shop: shopForTemplate,
  primaryColor,
  secondaryColor
  });
  } catch (e) {
  // If Handlebars fails, use the raw HTML as-is
  console.error('Handlebars error parsing customHtml:', e);
  dynamicTemplateHtml = shop.customization.customHtml;
  }
  } else if (templateType !== 'custom') {
  // For non-custom dynamic templates, look up in DynamicTemplate table
  const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
  where: { name: templateType }
  });

  if (dynamicTemplate) {
  let htmlCode = dynamicTemplate.htmlCode;
  let cssCode = dynamicTemplate.cssCode;

  const cacheKey = `shop-template-content:${shop.id}:${templateType}`;
  
  const cachedContent = await cacheService.getOrSet(cacheKey, async () => {
  let h = htmlCode;
  let c = cssCode;
  try {
  const kutzappFolderId = await getOrCreateFolder('kutzapp');
  if (kutzappFolderId) {
  const shopFolderId = await getOrCreateFolder(shop.id, kutzappFolderId);
  if (shopFolderId) {
  const templateFolderId = await getOrCreateFolder(templateType, shopFolderId);
  if (templateFolderId) {
  const driveHtml = await downloadFileFromFolder(templateFolderId, 'index.html');
  const driveCss = await downloadFileFromFolder(templateFolderId, 'styles.css');
  if (driveHtml) h = driveHtml;
  if (driveCss) c = driveCss;
  }
  }
  }
  } catch (e) {
  console.error('Failed to fetch template from Google Drive, falling back to DB:', e);
  }
  return { htmlCode: h, cssCode: c };
  }, 3600); // 1 hour cache TTL

  htmlCode = cachedContent.htmlCode;
  cssCode = cachedContent.cssCode;

  try {
  const Handlebars = (await import('handlebars')).default;
  const compiledTemplate = Handlebars.compile(htmlCode);

  dynamicTemplateHtml = compiledTemplate({
  ...shop.customization,
  shop: shopForTemplate,
  primaryColor,
  secondaryColor
  });
  dynamicTemplateCss = cssCode;
  } catch (e) {
  console.error('Handlebars error:', e);
  }
  }
  }
 }

 // Pass everything to the Client Component
 return (
 <>
 <ClientPage 
 shop={shop} 
 templateType={templateType} 
 primaryColor={primaryColor} 
 secondaryColor={secondaryColor} 
 sportRed={sportRed}
 reviews={shop.reviews || []}
 dynamicTemplateHtml={dynamicTemplateHtml}
 dynamicTemplateCss={dynamicTemplateCss}
 />
  {/* Dynamic templates load their own booking-widget.js with template-specific colors via inline SDK.
     Only inject AIWidget for built-in React templates that don't have their own widget loading. */}
  {!dynamicTemplateHtml && (
  <AIWidget shopId={shop.id} shopName={shop.name} themeColor={primaryColor} secondaryColor={secondaryColor} chatbotPosition={shop.customization?.chatbotPosition} colorTheme={shop.customization?.colorTheme || 'light'} templateType={templateType} />
  )}
 {/* Inject the booking modal script for this shop reliably */}
 <BookingModalScript shopId={shop.id} themeColor={primaryColor} templateType={templateType} />
 </>
 );
}
