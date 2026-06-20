import { NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ shopId: string, ruleId: string }> }) {
  const { shopId, ruleId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const tenantClient = await getTenantClient(shopId);
    const data = await request.json();
    const rule = await tenantClient.dynamicPricingRule.update({
      where: { id: ruleId, shopId },
      data: {
        name: data.name,
        type: data.type,
        adjustmentType: data.adjustmentType,
        adjustmentValue: data.adjustmentValue !== undefined ? parseFloat(data.adjustmentValue) : undefined,
        daysOfWeek: data.daysOfWeek !== undefined ? JSON.stringify(data.daysOfWeek) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      }
    });
    return NextResponse.json(rule);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ shopId: string, ruleId: string }> }) {
  const { shopId, ruleId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const tenantClient = await getTenantClient(shopId);
    await tenantClient.dynamicPricingRule.delete({
      where: { id: ruleId, shopId }
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
