const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'SHOP_ADMIN'] } },
    select: { id: true, role: true, shopId: true, name: true, email: true }
  });
  console.log("STAFF/SHOP_ADMIN users:", JSON.stringify(users, null, 2));

  const shops = await prisma.shop.findMany({
    select: { id: true, name: true }
  });
  console.log("Shops:", JSON.stringify(shops, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
