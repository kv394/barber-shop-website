require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst';
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (shop) {
    const staff = await prisma.user.findMany({ where: { shopId } });
    console.log('Shop found!', shop.name);
    console.log('Staff count:', staff.length);
  } else {
    console.log('Shop NOT found in DB.');
  }
}
main().finally(() => prisma.$disconnect());
