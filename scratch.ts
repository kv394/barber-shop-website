import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.time('fetchShops');
  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      _count: {
        select: { users: true, services: true, reviews: true },
      },
      users: {
        where: { role: { in: ['SHOP_ADMIN', 'STAFF'] } },
        select: { id: true, role: true },
      },
    },
  });
  console.timeEnd('fetchShops');
  console.log(`Fetched ${shops.length} shops`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
