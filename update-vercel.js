const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findUnique({
    where: { id: 'cmn9kj24n0000lqzc7kcsmpst' }
  });
  console.log("Current template:", shop?.template);
  console.log("Has custom HTML?", !!shop?.customization?.customHtml);
  if (shop?.customization?.customHtml) {
    console.log("Snippet:", shop.customization.customHtml.substring(0, 50));
  }
}

main().finally(() => prisma.$disconnect());
