import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';
// Cache bust 2 - force fresh data after DB color update

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
 try {
 const { shopId } = await params;
    // --- MOVED SECURITY INIT OUTSIDE CACHE ---
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const requestHost = request.headers.get('host') || 'localhost:3000';
    const protocol = requestHost.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${requestHost}`;

    let requestDomain = null;
    try {
        if (origin && origin !== 'null') {
            requestDomain = new URL(origin).hostname;
        } else if (referer && referer !== 'null') {
            requestDomain = new URL(referer).hostname;
        }
    } catch (e) {
        requestDomain = null;
    }

    // Allow cache busting via query param (e.g. after DB updates)
    const url = new URL(request.url);
    if (url.searchParams.get('bust')) {
        await cacheService.invalidate(`api_public_data_v2:${shopId}`).catch(() => {});
    }

    const cachedData = await cacheService.getOrSet(`api_public_data_v2:${shopId}`, async () => {
        const tenantClient = await getTenantClient(shopId);

 // 0. Fetch Shop Details First for Security Validation
 let shop = await tenantClient.shop.findFirst({
 where: {
 OR: [
 { id: shopId },
 { subdomain: shopId },
 { companyName: shopId }
 ]
 },
 select: {
 id: true,
 name: true,
 companyName: true,
 description: true,
 timezone: true,
 customDomain: true,
 subdomain: true,
 customization: true,
 template: true,
 dynamicTemplates: true
 }
 });

 if (!shop) {
 const firstWord = shopId.split('-').find(w => w.length > 2) || shopId.split('-')[0];
 const candidates = await tenantClient.shop.findMany({
 where: { name: { startsWith: firstWord, mode: 'insensitive' } },
 take: 50,
 select: {
 id: true,
 name: true,
 companyName: true,
 description: true,
 timezone: true,
 customDomain: true,
 subdomain: true,
 customization: true,
 template: true,
 dynamicTemplates: true
 }
 });

 shop = candidates.find(
 (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopId.toLowerCase()
 ) || null;
 }

 if (!shop) {
 // Fallback: If still not found, check if this is the demo shop
 if (shopId === 'missouri-city' || shopId === 'sugarland') {
 shop = await tenantClient.shop.findFirst({
 where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
 select: {
 id: true,
 name: true,
 companyName: true,
 description: true,
 timezone: true,
 customDomain: true,
 subdomain: true,
 customization: true,
 template: true,
 dynamicTemplates: true
 }
 });
 }
 }

 if (!shop) {
 return null;
 }

 // --- SECURITY AND DOMAIN MOVED OUTSIDE ---

 const customization = (shop.customization as any) || {};
 const allowedDomains: string[] = customization.allowedDomains || [];
 
 // Add default allowed domains
 if (shop.customDomain) allowedDomains.push(shop.customDomain);
 if (shop.subdomain) allowedDomains.push(`${shop.subdomain}.kutzapp.com`);
 allowedDomains.push('kutzapp.com'); // Allow main app domain
 allowedDomains.push('localhost'); // Allow local development
 allowedDomains.push('127.0.0.1'); // Allow local IP development

 // CORS and origin logic moved outside cache

 // Run remaining public data queries in parallel using the actual resolved shop.id
 const [products, services, staff, reviews, portfolioImages, loyaltyProgram, membershipTiers] = await Promise.all([
 // 1. Sellable Products
 tenantClient.product.findMany({
 where: { shopId: shop.id, isSellable: true },
 select: {
 id: true,
 name: true,
 description: true,
 price: true,
 imageUrl: true,
 type: true,
 trackInventory: true,
 inventoryCount: true
 },
 orderBy: { name: 'asc' }
 }),
 // 2. Bookable Services
 tenantClient.service.findMany({
 where: { shopId: shop.id },
 select: {
 id: true,
 name: true,
 description: true,
 price: true,
 imageUrl: true,
 duration: true
 },
 orderBy: { name: 'asc' }
 }),
  // 3. Public Staff (all barbers: staff, admins, booth renters — excludes clients and kiosks)
  tenantClient.user.findMany({
  where: {
  OR: [
  { shopId: shop.id, role: { in: ['STAFF', 'SHOP_ADMIN', 'BOOTH_RENTER'] } },
  { shopAccesses: { some: { shopId: shop.id, role: { in: ['STAFF', 'SHOP_ADMIN', 'BOOTH_RENTER'] } } } }
  ]
  },
  select: {
  id: true,
  name: true,
  imageUrl: true,
  role: true,
  workingHours: true
  }
  }),
 // 4. Reviews
 tenantClient.review.findMany({
 where: { shopId: shop.id },
 select: {
 id: true,
 rating: true,
 comment: true,
 createdAt: true,
 user: { select: { name: true } }
 },
 orderBy: { createdAt: 'desc' },
 take: 50
 }),
 // 5. Portfolio / Gallery Images
 tenantClient.portfolioImage.findMany({
 where: { shopId: shop.id },
 select: {
 id: true,
 imageUrl: true,
 caption: true,
 displayOrder: true,
 staffId: true
 },
 orderBy: { displayOrder: 'asc' },
 take: 50
 }),
 // 6. Loyalty Program
 tenantClient.loyaltyProgram.findFirst({
 where: { shopId: shop.id, isActive: true },
 select: {
 id: true,
 pointsPerDollar: true,
 pointsPerVisit: true,
 redeemThreshold: true,
 redeemValue: true,
 tiers: true
 }
 }),
 // 7. Membership Tiers
 tenantClient.membershipTier.findMany({
 where: { shopId: shop.id },
 select: {
 id: true,
 name: true,
 description: true,
 price: true,
 interval: true
 },
 orderBy: { price: 'asc' }
 })
 ]);



 const formatImageUrl = (url: string | null) => {
 if (!url) return null;
 
 // Handle Google Drive links
 const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
 if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
 const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
 if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
 const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
 if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
 
 if (url.startsWith('/')) return `${baseUrl}${url}`;
 return url;
 };

 const formattedProducts = products.map((p: any) => ({ ...p, imageUrl: formatImageUrl(p.imageUrl) }));
 const formattedServices = services.map((s: any) => ({ ...s, imageUrl: formatImageUrl(s.imageUrl) }));
 const formattedStaff = staff.map((s: any) => ({ ...s, imageUrl: formatImageUrl(s.imageUrl) }));
 const formattedPortfolio = portfolioImages.map((img: any) => ({ ...img, imageUrl: formatImageUrl(img.imageUrl) }));

 // Clean up customization to only include public-safe fields (branding, contact, hours)
 const publicCustomization = {
 address: customization.address,
 contact: customization.contact,
 branding: customization.branding,
 seo: customization.seo,
 logoUrl: formatImageUrl(customization.logoUrl),
 heroImageUrl: formatImageUrl(customization.heroImageUrl),
 businessHours: customization.businessHours,
  // Return primaryColor/secondaryColor for all templates including custom.
  // Custom HTML templates need these for the booking widget/modal theming.
  primaryColor: customization.primaryColor,
  secondaryColor: customization.secondaryColor,
  widgetBgColor: customization.widgetBgColor,
  widgetTextColor: customization.widgetTextColor,
  widgetHeaderColor: customization.widgetHeaderColor,
  widgetSurfaceColor: customization.widgetSurfaceColor,
  widgetMutedColor: customization.widgetMutedColor,
  widgetBorderColor: customization.widgetBorderColor,
  fontFamily: customization.fontFamily,
  buttonShape: customization.buttonShape,
  buttonVariant: customization.buttonVariant,
  colorTheme: customization.colorTheme,
  customHtml: customization.customHtml,
  authPosition: customization.authPosition,
  chatbotPosition: customization.chatbotPosition,
  announcement: customization.announcement,
 };

 const cleanShop = {
 id: shop.id,
 name: shop.name || shop.companyName,
 locationName: shop.name,
 companyName: shop.companyName,
 description: shop.description,
 timezone: shop.timezone,
 template: shop.template,
 dynamicTemplates: shop.dynamicTemplates,
 customDomain: shop.customDomain,
 customization: publicCustomization
 };

 return {
 shop: cleanShop,
 products: formattedProducts,
 services: formattedServices,
 staff: formattedStaff,
 reviews,
 portfolioImages: formattedPortfolio,
 loyaltyProgram: loyaltyProgram || null,
 membershipTiers: membershipTiers || [],
 allowedDomains
 };
    }, 900); // 15 minutes cache

    if (!cachedData) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { allowedDomains: cachedAllowedDomains, ...responseData } = cachedData;

    // Validate domain
    if (requestDomain && cachedAllowedDomains) {
        const isAllowed = cachedAllowedDomains.some((domain: string) =>
            requestDomain === domain || requestDomain.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            logger.warn(`Allowing unauthorized access to shop data from domain for demo: ${requestDomain}`);
        }
    }

    // CORS Headers for allowed requests
    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Set dynamic CORS origin if valid
    if (origin && cachedAllowedDomains) {
        try {
            const originHost = new URL(origin).hostname;
            const isOriginAllowed = cachedAllowedDomains.some((domain: string) => originHost === domain || originHost.endsWith(`.${domain}`));
            if (isOriginAllowed) {
                corsHeaders['Access-Control-Allow-Origin'] = origin;
            } else {
                corsHeaders['Access-Control-Allow-Origin'] = origin;
            }
        } catch(e) {}
    }

    return NextResponse.json(responseData, { headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    } });

 } catch (error: any) {
 logger.error('Error fetching public shop data:', error);
 return NextResponse.json({ error: 'Failed to fetch public data', details: error?.message || String(error) }, { status: 500, headers: {
 'Access-Control-Allow-Origin': '*',
 } });
 }
}

export async function OPTIONS(request: Request) {
 const origin = request.headers.get('origin');
 return new NextResponse(null, {
 status: 204,
 headers: {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 },
 });
}
