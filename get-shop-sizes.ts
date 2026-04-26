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

  console.log("Shop name:", shop.name);
  const cust: any = shop.customization || {};
  console.log("Total customization size:", JSON.stringify(cust).length);
  
  for (const key in cust) {
    console.log(`Key ${key} size:`, JSON.stringify(cust[key] || {}).length);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
