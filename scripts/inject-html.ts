import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst({
    where: { name: { contains: 'Heritage', mode: 'insensitive' } }
  });
  if (!shop) throw new Error('Shop not found');
  
  const customization = (shop.customization || {}) as any;
  const html = fs.readFileSync('public/html-sections/heritage-haircuts.html', 'utf8');
  
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      customization: {
        ...customization,
        customHtml: html
      }
    }
  });
  console.log('Successfully injected customHtml for', shop.name);
}
main().catch(console.error).finally(() => prisma.$disconnect());
