import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireSiteAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const shops = await prisma.shop.findMany();
    const invalidShops = shops.filter(s => !/^[a-z0-9]{20,30}$/.test(s.id));
    
    const deleted = [];
    for (const shop of invalidShops) {
      await prisma.$transaction(async (tx: any) => {
        await tx.user.deleteMany({
          where: { shopId: shop.id, role: 'ATTENDANCE_KIOSK' }
        });
        await tx.user.updateMany({
          where: { shopId: shop.id },
          data: { role: 'CLIENT', canManageInventory: false }
        });
        await tx.shop.delete({ where: { id: shop.id } });
      });
      deleted.push(shop.id);
    }
    
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/siteadmin/shops', 'page');
    revalidatePath('/siteadmin', 'layout');
    
    return NextResponse.json({ success: true, allShops: shops.map(s => s.id), deleted });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
