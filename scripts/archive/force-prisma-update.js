const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const html = fs.readFileSync('public/html-sections/SportClips.html', 'utf8');
    
    const existingShop = await prisma.shop.findUnique({
      where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
      select: { customization: true },
    });
    
    const custom = existingShop.customization || {};
    custom.customHtml = html;
    
    await prisma.shop.update({
      where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
      data: { customization: custom },
    });
    
    console.log('✅ Updated database using Prisma Client!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
