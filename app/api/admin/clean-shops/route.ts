import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
    
    return NextResponse.json({ success: true, allShops: shops.map(s => s.id), deleted });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, stack: e.stack });
  }
}
