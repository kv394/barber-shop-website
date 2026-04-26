import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const shop = await prisma.shop.findUnique({
    where: { id: 'cmn9kj24n0000lqzc7kcsmpst' }
  });
  console.log("Template:", shop?.template);
  console.log("Has custom HTML:", !!shop?.customization?.customHtml);
}
main().finally(() => prisma.$disconnect());
