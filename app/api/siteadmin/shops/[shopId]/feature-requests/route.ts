import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * GET /api/siteadmin/shops/[shopId]/feature-requests
 * Returns all feature requests for a shop (site admin view).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireSiteAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { customization: true, premiumFeatures: true, name: true },
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customization = (shop.customization as Record<string, any>) || {};
  const featureRequests = customization.featureRequests || [];
  const premiumFeatures = (shop.premiumFeatures as Record<string, boolean>) || {};

  return NextResponse.json({ featureRequests, premiumFeatures, shopName: shop.name });
}

/**
 * PATCH /api/siteadmin/shops/[shopId]/feature-requests
 * Approve or deny a feature request.
 * Body: { requestId, action: 'approve' | 'deny' }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireSiteAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { requestId, action } = await request.json();

  if (!requestId || !['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'requestId and action (approve/deny) are required' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { customization: true, premiumFeatures: true },
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customization = (shop.customization as Record<string, any>) || {};
  const featureRequests: any[] = customization.featureRequests || [];
  const premiumFeatures = (shop.premiumFeatures as Record<string, boolean>) || {};

  const requestIndex = featureRequests.findIndex((r: any) => r.id === requestId);
  if (requestIndex === -1) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const req = featureRequests[requestIndex];

  if (action === 'approve') {
    // Enable the feature
    premiumFeatures[req.featureId] = true;
    req.status = 'APPROVED';
    req.resolvedAt = new Date().toISOString();
  } else {
    req.status = 'DENIED';
    req.resolvedAt = new Date().toISOString();
  }

  featureRequests[requestIndex] = req;
  customization.featureRequests = featureRequests;

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      customization,
      premiumFeatures,
    },
  });

  return NextResponse.json({
    success: true,
    message: action === 'approve'
      ? `${req.featureName} has been enabled for this shop`
      : `${req.featureName} request has been denied`,
  });
}
