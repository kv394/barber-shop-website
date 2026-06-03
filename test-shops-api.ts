import { prisma } from './lib/prisma';

async function main() {
  try {
    const shops = await prisma.shop.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        supportAccessEnabled: true,
        supportAccessExpiresAt: true,
        premiumFeatures: true
      }
    });
    console.log("SUCCESS:", shops);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
