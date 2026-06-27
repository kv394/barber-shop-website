import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

/**
 * PATCH /api/shops/[shopId]/gamification/[campaignId]
 * Update a gamification campaign.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string; campaignId: string }> }
) {
  const { shopId, campaignId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const data = await request.json();
    const { name, status, config, startDate, endDate, maxPlaysPerUser, playLimitType } = data;

    // Validate status if provided
    if (status && !['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (config !== undefined) updateData.config = config;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (maxPlaysPerUser !== undefined) updateData.maxPlaysPerUser = maxPlaysPerUser;
    if (playLimitType !== undefined) updateData.playLimitType = playLimitType;

    const campaign = await prisma.gamificationCampaign.update({
      where: { id: campaignId, shopId },
      data: updateData,
    });

    return NextResponse.json(campaign);
  } catch (err: any) {
    console.error('Failed to update campaign:', err);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

/**
 * DELETE /api/shops/[shopId]/gamification/[campaignId]
 * Delete a gamification campaign and all its plays.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string; campaignId: string }> }
) {
  const { shopId, campaignId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await prisma.gamificationCampaign.delete({
      where: { id: campaignId, shopId },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete campaign:', err);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
