const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findUnique({
    where: { id: 'cmn9kj24n0000lqzc7kcsmpst' }
  });
  console.log("Template:", shop.template);
  console.log("Has custom HTML:", !!shop.customization.customHtml);
  console.log("HTML Preview:", shop.customization.customHtml ? shop.customization.customHtml.substring(0, 50) : "N/A");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
