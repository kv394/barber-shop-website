import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin for this shop or a SITE_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this shop' },
        { status: 403 }
      );
    }

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
    if (customizationStr.length > 50000) {
      return NextResponse.json(
        { error: 'Customization data is too large' },
        { status: 400 }
      );
    }

    // Merge with existing customization to preserve bookingSettings/notifSettings
    // set by other dedicated routes
    const existingShop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });
    const existing = (existingShop?.customization as any) || {};

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        customization: { ...existing, ...customization },
      },
    });

    // Clear the Redis cache for anyone accessing this shop
    await cacheService.invalidatePattern(`shop_layout:*:${shopId}`);

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
