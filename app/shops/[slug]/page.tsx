export const dynamic = 'force-dynamic';

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
import { getShopPublicData } from '@/lib/shop-public-data';

// Use this to ensure the page caches effectively unless revalidated

const getShopBySlug = cache(async (slug: string) => {
  const data = await getShopPublicData(slug);
  if (!data) return null;
  
  const { shop, products, services, staff, reviews, portfolioImages } = data;
  
  return {
    ...shop,
    products,
    services,
    users: staff,
    reviews,
    portfolioImages,
    baseLocation: shop.customization?.address || shop.baseLocation,
  };
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
      await cacheService.invalidate(`api_public_data_v2:${slug}`).catch(() => {});
      await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
   }
   shop = await getShopBySlug(slug);

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
  let primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
  let secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
  const templateType = shop.template || 'modern';
  const sportRed = shop.customization?.primaryColor || '#d50000'; // Default to a strong red



  let dynamicTemplateHtml = null;
  let dynamicTemplateCss = null;

  // Helper to normalize Google Drive image URLs
  const { normalizeGoogleDriveUrl: normalizeImageUrl } = await import('@/lib/image-utils');

  const shopForTemplate = {
  ...shop,
  logoUrl: normalizeImageUrl(shop.customization?.logoUrl) || (shop as any).logoUrl,
  heroImageUrl: normalizeImageUrl(shop.customization?.heroImageUrl) || (shop as any).heroImageUrl
  };

  if (shop.customization?.customHtml && shop.customization.customHtml.trim() !== '') {


  try {
  const Mustache = (await import('mustache')).default;
  let compiledHtml = Mustache.render(shop.customization.customHtml, {
  ...shop.customization,
  shop: shopForTemplate,
  primaryColor,
  secondaryColor
  });
   // Inject server-side theme colors so the template JS uses DB values
   // instead of relying on the cached API response
    const injectedLogoUrl = shopForTemplate.logoUrl || '';
    const injectedHeroImageUrl = shopForTemplate.heroImageUrl || shop.customization?.heroImageUrl || '';
    const injectedShopName = (shop.name || '').replace(/"/g, '\\"');
    const themeInjection = `<script>window.__KUTZ_THEME__={primaryColor:"${primaryColor}",secondaryColor:"${secondaryColor}",logoUrl:"${injectedLogoUrl}",heroImageUrl:"${injectedHeroImageUrl}",shopName:"${injectedShopName}"};</script>`;
  // Insert before </head> or at the start of the HTML
  if (compiledHtml.includes('</head>')) {
  compiledHtml = compiledHtml.replace('</head>', themeInjection + '</head>');
  } else {
  compiledHtml = themeInjection + compiledHtml;
  }
  dynamicTemplateHtml = compiledHtml;
  } catch (e: any) {
  // If Handlebars fails, use the raw HTML as-is
  console.error('Mustache error parsing customHtml:', e);
  dynamicTemplateHtml = `<!-- ERROR: ${e.message} -->\n` + shop.customization.customHtml;
  }
  } else {
    dynamicTemplateHtml = `<!-- DEBUG: customHtml is falsy! Type: ${typeof shop.customization?.customHtml}, Len: ${shop.customization?.customHtml?.length} -->`;
  }
  
  if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType) && !shop.customization?.customHtml) {

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
  const Mustache = (await import('mustache')).default;
  dynamicTemplateHtml = Mustache.render(htmlCode, {
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
  <AIWidget shopId={shop.id} shopName={shop.name} themeColor={primaryColor} secondaryColor={secondaryColor} templateType={templateType} shopType={(shop as any).shopType} slogan={(shop as any).slogan || (shop as any).customization?.tagline} />
  )}
 {/* Only inject BookingModalScript for built-in React templates.
     Custom HTML templates already load their own booking-modal.js with
     the correct theme colors from their inline JavaScript/SDK. */}
 {!dynamicTemplateHtml && (
 <BookingModalScript shopId={shop.id} themeColor={primaryColor} secondaryColor={secondaryColor} templateType={templateType} headingFont={shop.customization?.fontFamily} bodyFont={shop.customization?.fontFamily} colorTheme={shop.customization?.colorTheme || 'light'} />
 )}
 </>
 );
}
