import { prisma } from './lib/prisma';

async function run() {
  const shop = await prisma.shop.findFirst({
    where: { 
      name: { contains: "missouri", mode: "insensitive" } 
    }
  });

  if (!shop) {
    console.log("Shop not found");
    return;
  }

  const cust = shop.customization || {};
  const pages = (cust as any).pages || [];
  
  for (const page of pages) {
    console.log(`Page: ${page.title}, isVisible: ${page.isVisible} (type: ${typeof page.isVisible})`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
