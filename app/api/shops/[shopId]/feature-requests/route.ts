import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

/**
 * GET /api/shops/[shopId]/feature-requests
 * Returns the shop's pending and past feature requests.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { customization: true, premiumFeatures: true },
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customization = (shop.customization as Record<string, any>) || {};
  const featureRequests = customization.featureRequests || [];
  const premiumFeatures = (shop.premiumFeatures as Record<string, boolean>) || {};

  return NextResponse.json({ featureRequests, premiumFeatures });
}

/**
 * POST /api/shops/[shopId]/feature-requests
 * Shop admin requests a premium feature.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  const { featureId, featureName } = await request.json();

  if (!featureId || !featureName) {
    return NextResponse.json({ error: 'featureId and featureName are required' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { customization: true, premiumFeatures: true },
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // Check if feature is already enabled
  const premiumFeatures = (shop.premiumFeatures as Record<string, boolean>) || {};
  if (premiumFeatures[featureId]) {
    return NextResponse.json({ error: 'This feature is already enabled' }, { status: 400 });
  }

  // Check for existing pending request
  const customization = (shop.customization as Record<string, any>) || {};
  const featureRequests: any[] = customization.featureRequests || [];
  const existingPending = featureRequests.find(
    (r: any) => r.featureId === featureId && r.status === 'PENDING'
  );

  if (existingPending) {
    return NextResponse.json({ error: 'A request for this feature is already pending' }, { status: 400 });
  }

  // Add the request
  featureRequests.push({
    id: `fr_${Date.now()}`,
    featureId,
    featureName,
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
    requestedBy: authResult.user.name || authResult.user.email || 'Shop Admin',
  });

  customization.featureRequests = featureRequests;

  await prisma.shop.update({
    where: { id: shopId },
    data: { customization },
  });

  return NextResponse.json({ success: true, message: 'Feature request submitted!' });
}
