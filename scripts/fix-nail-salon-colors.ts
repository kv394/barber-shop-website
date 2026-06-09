// Verify the DB actually has the correct colors
import { prisma } from '../lib/prisma';

async function main() {
  const shop = await prisma.shop.findUnique({
    where: { id: 'cmpksdwb90000j12g6jzm5dfi' },
    select: { id: true, name: true, customization: true }
  });
  
  if (!shop) { console.log('NOT FOUND'); return; }
  
  const c = (shop.customization as any) || {};
  console.log(`Shop: ${shop.name}`);
  console.log(`primaryColor: ${c.primaryColor}`);
  console.log(`secondaryColor: ${c.secondaryColor}`);
  console.log(`headingFont: ${c.headingFont}`);
  console.log(`bodyFont: ${c.bodyFont}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
