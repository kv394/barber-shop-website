require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany({
    where: { name: 'Heritage Haircuts' }
  });
  
  console.log('Found shops:', shops.map(s => ({ id: s.id, name: s.name, companyName: s.companyName })));
  
  for (const shop of shops) {
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: 'Missouri City',
        companyName: shop.companyName || 'Heritage Haircuts' // Ensure company name is set so it groups correctly
      }
    });
    console.log(`Updated shop ${shop.id} to Missouri City`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
