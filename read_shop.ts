import { prisma } from './lib/prisma';
async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: 'cmn9kj24n0000lqzc7kcsmpst' } });
  console.log(JSON.stringify(shop, null, 2));
  process.exit(0);
}
main();