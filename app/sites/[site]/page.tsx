import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import ClientPage from '@/app/shops/[slug]/ClientPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrCreateFolder, downloadFileFromFolder } from '@/lib/google-drive';
import { cacheService } from '@/lib/cache';
import AIWidget from '@/components/booking/AIWidget';
import { serialize } from '@/lib/serialize';

export const revalidate = 60;

const serviceInclude = {
 services: {
 where: { type: 'CUSTOMER' as const },
 orderBy: { createdAt: 'desc' as const },
 select: { id: true, name: true, description: true, price: true, duration: true },
 },
 products: {
 where: { type: 'RETAIL' as const },
 select: { id: true, name: true, description: true, price: true },
 },
 portfolioImages: {
 select: { id: true, imageUrl: true, caption: true },
 },
};

const getShopBySite = cache(async (site: string) => {
 // If it's a subdomain on vercel, extract the subdomain
 let subdomain = site;
 let customDomain = site;
 
 if (site.includes('.vercel.app')) {
 subdomain = site.split('.')[0];
 } else if (site.includes('localhost')) {
 subdomain = site.split(':')[0]; // Just in case, though middleware excludes localhost
 }

 // 1. Try to find by customDomain
 let shop: any = await prisma.shop.findUnique({
 where: { customDomain: site },
 include: serviceInclude,
 });

 // 2. Try to find by subdomain
 if (!shop && subdomain) {
 shop = await prisma.shop.findUnique({
 where: { subdomain },
 include: serviceInclude,
 });
 }
 
 // Fallback (for testing / backward compat): treat site as slug/ID
 if (!shop) {
 shop = await prisma.shop.findUnique({
 where: { id: site.split('.')[0] },
 include: serviceInclude,
 });
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
 const rawCustom = serialized.customization || {};
 
 const rawAddress = rawCustom.address;
 const formattedAddress = typeof rawAddress === 'object' && rawAddress !== null
 ? [rawAddress.street, rawAddress.suite, rawAddress.city, rawAddress.state, rawAddress.zip, rawAddress.country].filter(Boolean).join(', ')
 : rawAddress;

 const publicCustomization = {
 ...rawCustom,
 address: formattedAddress,
 };
 return {
 ...serialized,
 customization: publicCustomization,
 template: serialized.template || 'modern',
 reviews: serialize(reviews),
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
 const Handlebars = (await import('handlebars')).default;
 const compiledTemplate = Handlebars.compile(htmlCode);

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

 dynamicTemplateHtml = compiledTemplate({
 ...(shop.customization || {}),
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
 <AIWidget shopId={shop.id} />
 </>
 );
}
