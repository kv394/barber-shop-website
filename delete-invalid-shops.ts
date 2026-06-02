import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const shops = await prisma.shop.findMany();
    const invalidShops = shops.filter(s => !/^[a-z0-9]{20,30}$/.test(s.id));
    console.log(`Found ${invalidShops.length} invalid shops:`, invalidShops.map(s => s.id));
    
    for (const shop of invalidShops) {
      console.log(`Cleaning up shop ${shop.id}...`);
      await prisma.$transaction(async (tx) => {
        await tx.user.deleteMany({
          where: { shopId: shop.id, role: 'ATTENDANCE_KIOSK' }
        });
        await tx.user.updateMany({
          where: { shopId: shop.id },
          data: { role: 'CLIENT', canManageInventory: false }
        });
        await tx.shop.delete({ where: { id: shop.id } });
      });
      console.log(`Successfully deleted ${shop.id}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
