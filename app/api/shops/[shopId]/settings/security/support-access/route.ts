import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError, safeErrorResponse } from '@/lib/auth';
import { getTenantClient } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const shopId = (await params).shopId;
    const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const { enabled } = await req.json();
    const tenantPrisma = getTenantClient(shopId);

    let updateData: any = { supportAccessEnabled: Boolean(enabled) };
    if (enabled) {
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      updateData.supportAccessExpiresAt = expiresAt;
    } else {
      updateData.supportAccessExpiresAt = null;
    }

    const updatedShop = await tenantPrisma.shop.update({
      where: { id: shopId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      supportAccessEnabled: updatedShop.supportAccessEnabled,
      supportAccessExpiresAt: updatedShop.supportAccessExpiresAt
    });
  } catch (error) {
    console.error('Error updating support access:', error);
    return safeErrorResponse(error, 'Failed to update support access');
  }
}
