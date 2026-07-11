import Image from 'next/image';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import ClientPage from '@/app/shops/[slug]/ClientPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AIWidget from '@/components/booking/AIWidget';
import { getShopPublicData } from '@/lib/shop-public-data';
import { getOrCreateFolder, downloadFileFromFolder } from '@/lib/google-drive';
import { cacheService } from '@/lib/cache';

export const revalidate = 60;

const getShopBySite = cache(async (site: string) => {
  // Try resolving as a domain/subdomain using getShopPublicData
  const data = await getShopPublicData(site);
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

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
 const { site } = await params;
 const shop = await getShopBySite(decodeURIComponent(site));

 if (!shop) {
 return {
 title: 'Shop Not Found',
 description: 'The shop you are looking for does not exist.',
 };
 }

 return {
 title: `${shop.name} - Services & Booking`,
 description: shop.description || `Book services at ${shop.name}`,
 openGraph: {
 title: `${shop.name} - Services & Booking`,
 description: shop.description || `Book services at ${shop.name}`,
 },
 };
}

export default async function SitePage({ params }: { params: Promise<{ site: string }> }) {
 const { site } = await params;
 const shop = await getShopBySite(decodeURIComponent(site));

 if (!shop) {
 return (
 <div className="min-h-screen overflow-x-hidden flex flex-col flex items-center justify-center">
 <div className="text-center">
 <h1 className="font-bold text-crm-text mb-4 text-2xl font-bold">Shop Not Found</h1>
 <p className="text-crm-muted text-[13px]">We couldn't find the shop for this domain ({site}).</p>
 </div>
 </div>
 );
 }

 const primaryColor = shop.customization?.primaryColor || '#3b82f6';
 const secondaryColor = shop.customization?.secondaryColor || '#06b6d4';
 const templateType = shop.template || 'modern';
 const sportRed = shop.customization?.primaryColor || '#d50000';

 let dynamicTemplateHtml = null;
 let dynamicTemplateCss = null;

 if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType)) {
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

 const { normalizeGoogleDriveUrl: normalizeImageUrl } = await import('@/lib/image-utils');

 const shopForTemplate = {
 ...shop,
 logoUrl: normalizeImageUrl(shop.customization?.logoUrl) || (shop as any).logoUrl,
 heroImageUrl: normalizeImageUrl(shop.customization?.heroImageUrl) || (shop as any).heroImageUrl
 };

 dynamicTemplateHtml = Mustache.render(htmlCode, {
 ...(shop.customization || {}),
 shop: shopForTemplate,
 primaryColor,
 secondaryColor
 });
 dynamicTemplateCss = cssCode;
 } catch (e) {
 console.error('Mustache error:', e);
 }
 }
 }

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
 <AIWidget shopId={shop.id} shopName={shop.name} themeColor={primaryColor} secondaryColor={secondaryColor} templateType={templateType} shopType={(shop as any).shopType} slogan={(shop as any).slogan || (shop as any).customization?.tagline} />
 </>
 );
}
