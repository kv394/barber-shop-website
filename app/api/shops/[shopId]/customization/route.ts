import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 
 // SECURITY: Authenticate before allowing customization updates
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const { customization } = body;

 if (!customization || typeof customization !== 'object' || Array.isArray(customization)) {
 return NextResponse.json(
 { error: 'Customization must be a valid JSON object' },
 { status: 400 }
 );
 }

 // SECURITY: Limit JSON payload size to prevent DoS via oversized customization blobs
 const customizationStr = JSON.stringify(customization);
 if (customizationStr.length > 2000000) {
 return NextResponse.json(
 { error: 'Customization data is too large' },
 { status: 400 }
 );
 }

 // Merge with existing customization to preserve bookingSettings/notifSettings
 // set by other dedicated routes
 const existingShop = await tenantClient.shop.findUnique({
 where: { id: shopId },
 select: { customization: true },
 });
 const existing = (existingShop?.customization as any) || {};

  // Normalize /api/assets/{fileId} URLs to public Google Drive URLs
  // The admin MediaPicker uploads return /api/assets/{fileId} which requires auth,
  // but landing pages are public and can't access authenticated endpoints.
  const normalizeAssetUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    const match = url.match(/\/api\/assets\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return url;
  };
  const normalizedCustomization = {
    ...customization,
    ...(customization.logoUrl !== undefined && { logoUrl: normalizeAssetUrl(customization.logoUrl) }),
    ...(customization.heroImageUrl !== undefined && { heroImageUrl: normalizeAssetUrl(customization.heroImageUrl) }),
  };

 const updatedShop = await tenantClient.shop.update({
 where: { id: shopId },
 data: {
 customization: { ...existing, ...normalizedCustomization },
 },
 });

 // Clear the Redis cache for anyone accessing this shop
 await cacheService.invalidatePattern(`shop_layout:*:${shopId}`);
 await cacheService.invalidatePattern(`shop_public_page_data:*`);
 await cacheService.invalidate(`shop_public_page_data:${shopId}`);
 await cacheService.invalidatePattern(`shop-template-content:${shopId}:*`);
 // Invalidate the public-data API cache (used by landing pages & SDK)
 await cacheService.invalidate(`api_public_data_v2:${shopId}`);

 // Clear the Next.js router cache so the new customization is applied everywhere
 revalidatePath(`/shop/${shopId}`);
 revalidatePath(`/shop/${shopId}/config`);
 revalidatePath('/shops/[slug]', 'page');

 return NextResponse.json(updatedShop, { status: 200 });
 } catch (error: any) {
 logger.error('Error updating customization:', error);
 return NextResponse.json(
 { error: 'Failed to update customization' },
 { status: 500 }
 );
 }
}
