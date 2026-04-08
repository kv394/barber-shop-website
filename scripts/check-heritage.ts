import { prisma } from '../lib/prisma';

async function main() {
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst';
  const staff = await prisma.user.findMany({
    where: { shopId },
    select: { id: true, name: true, role: true }
  });
  console.log("Staff for shop:", JSON.stringify(staff, null, 2));

  const allShops = await prisma.shop.findMany({
    select: { id: true, name: true }
  });
  console.log("All Shops:", JSON.stringify(allShops, null, 2));
}

main().finally(() => prisma.$disconnect());
