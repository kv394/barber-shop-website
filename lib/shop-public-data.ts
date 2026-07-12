import { prisma, getTenantClient } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export async function getShopPublicData(shopIdOrSlug: string, baseUrl: string = 'https://kutzapp.com', isPreview: boolean = false) {
  // Resolve slug-based shopId to a real CUID before creating the tenant client.
  const SHOP_ID_FORMAT = /^[a-z0-9]{20,30}$/;
  let resolvedShopId = shopIdOrSlug;

  if (!SHOP_ID_FORMAT.test(shopIdOrSlug)) {
    const firstWord = shopIdOrSlug.split('-').find(w => w.length > 2) || shopIdOrSlug.split('-')[0];
    const candidates = await prisma.shop.findMany({
      where: { name: { contains: firstWord, mode: 'insensitive' } },
      select: { id: true, name: true, customization: true },
      take: 50,
    });

    const matched = candidates.find(
      (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopIdOrSlug.toLowerCase()
    );

    let shop = matched;
    if (shop) {
      const allMatches = candidates.filter(
        (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopIdOrSlug.toLowerCase()
      );
      if (allMatches.length > 1) {
        const customMatch = allMatches.find(
          (s: any) => s.customization && (s.customization as any).customHtml
        );
        if (customMatch) shop = customMatch;
      }
      resolvedShopId = shop.id;
    } else if ((shopIdOrSlug === 'missouri-city' || shopIdOrSlug === 'sugarland') && process.env.DEMO_SHOP_ID) {
      resolvedShopId = process.env.DEMO_SHOP_ID;
    } else {
      return null;
    }
  }

  const fetcher = async () => {
    const tenantClient = getTenantClient(resolvedShopId);

    let shop = await tenantClient.shop.findFirst({
      where: {
        OR: [
          { id: resolvedShopId },
          { subdomain: shopIdOrSlug },
          { companyName: shopIdOrSlug }
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
        dynamicTemplates: true,
        industryType: true,
        baseLocation: true,
        shopType: true,
        slogan: true,
      }
    });

    if (!shop) return null;

    const customization = (shop.customization as any) || {};
    const allowedDomains: string[] = customization.allowedDomains || [];
    
    if (shop.customDomain) allowedDomains.push(shop.customDomain);
    if (shop.subdomain) allowedDomains.push(`${shop.subdomain}.kutzapp.com`);
    allowedDomains.push('kutzapp.com', 'vercel.app', 'localhost', '127.0.0.1');

    const [products, services, staff, reviews, portfolioImages, loyaltyProgram, membershipTiers] = await Promise.all([
      tenantClient.product.findMany({
        where: { shopId: shop.id, isSellable: true },
        select: { id: true, name: true, description: true, price: true, imageUrl: true, type: true, trackInventory: true, inventoryCount: true },
        orderBy: { name: 'asc' }
      }),
      tenantClient.service.findMany({
        where: { shopId: shop.id },
        select: { id: true, name: true, description: true, price: true, imageUrl: true, duration: true, dropInPrice: true, semesterPrice: true },
        orderBy: { name: 'asc' }
      }),
      tenantClient.user.findMany({
        where: {
          OR: [
            { shopId: shop.id, role: 'STAFF' },
            { shopId: shop.id, role: 'BOOTH_RENTER', isBookable: true },
            { shopAccesses: { some: { shopId: shop.id, role: 'STAFF' } } },
            { shopAccesses: { some: { shopId: shop.id, role: 'BOOTH_RENTER' } }, isBookable: true },
          ]
        },
        select: { id: true, name: true, imageUrl: true, role: true, workingHours: true }
      }),
      tenantClient.review.findMany({
        where: { shopId: shop.id },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      tenantClient.portfolioImage.findMany({
        where: { shopId: shop.id },
        select: { id: true, imageUrl: true, caption: true, displayOrder: true, staffId: true },
        orderBy: { displayOrder: 'asc' },
        take: 50
      }),
      tenantClient.loyaltyProgram.findFirst({
        where: { shopId: shop.id, isActive: true },
        select: { id: true, pointsPerDollar: true, pointsPerVisit: true, redeemThreshold: true, redeemValue: true, tiers: true }
      }),
      tenantClient.membershipTier.findMany({
        where: { shopId: shop.id },
        select: { id: true, name: true, description: true, price: true, interval: true },
        orderBy: { price: 'asc' }
      })
    ]);

    const { formatImageUrl: _formatImageUrl } = await import('@/lib/image-utils');
    const formatImageUrl = (url: string | null) => _formatImageUrl(url, baseUrl);

    const publicCustomization = {
      address: customization.address,
      phone: customization.phone || (customization.contact || {}).phone || null,
      email: customization.email || (customization.contact || {}).email || null,
      contact: customization.contact,
      branding: customization.branding,
      seo: customization.seo,
      logoUrl: formatImageUrl(customization.logoUrl),
      heroImageUrl: formatImageUrl(customization.heroImageUrl),
      businessHours: customization.businessHours,
      primaryColor: customization.primaryColor,
      secondaryColor: customization.secondaryColor,
      widgetBgColor: customization.widgetBgColor,
      widgetTextColor: customization.widgetTextColor,
      widgetHeaderColor: customization.widgetHeaderColor,
      widgetSurfaceColor: customization.widgetSurfaceColor,
      widgetMutedColor: customization.widgetMutedColor,
      widgetBorderColor: customization.widgetBorderColor,
      widgetUserMsgText: customization.widgetUserMsgText,
      widgetBotMsgBg: customization.widgetBotMsgBg,
      widgetInputBg: customization.widgetInputBg,
      fontFamily: customization.fontFamily,
      buttonShape: customization.buttonShape,
      buttonVariant: customization.buttonVariant,
      colorTheme: customization.colorTheme,
      customHtml: customization.customHtml,
      authPosition: customization.authPosition,
      chatbotPosition: customization.chatbotPosition,
      faviconUrl: customization.faviconUrl,
      customCss: customization.customCss,
      announcement: customization.announcement,
      heroVideoUrl: formatImageUrl(customization.heroVideoUrl),
    };

    return {
      shop: {
        id: shop.id,
        name: shop.name,
        companyName: shop.companyName,
        description: shop.description,
        timezone: shop.timezone,
        customDomain: shop.customDomain,
        subdomain: shop.subdomain,
        template: shop.template,
        dynamicTemplates: shop.dynamicTemplates,
        industryType: shop.industryType,
        baseLocation: shop.baseLocation,
        shopType: shop.shopType,
        slogan: shop.slogan,
        customization: publicCustomization,
      },
      products: products.map((p: any) => ({ ...p, imageUrl: formatImageUrl(p.imageUrl) })),
      services: services.map((s: any) => ({ ...s, imageUrl: formatImageUrl(s.imageUrl) })),
      staff: staff.map((s: any) => ({ ...s, imageUrl: formatImageUrl(s.imageUrl) })),
      reviews,
      portfolioImages: portfolioImages.map((img: any) => ({ ...img, imageUrl: formatImageUrl(img.imageUrl) })),
      loyaltyProgram,
      membershipTiers,
      allowedDomains
    };
  };

  if (isPreview) {
    return await fetcher();
  }

  const cachedData = await cacheService.getOrSet(`api_public_data_v2:${resolvedShopId}`, fetcher, 300);

  return cachedData;
}
