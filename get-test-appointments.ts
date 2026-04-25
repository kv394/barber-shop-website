import { prisma } from './lib/prisma';
async function main() {
  const apps = await prisma.appointment.findMany({
    where: { shopId: 'cmn9kj24n0000lqzc7kcsmpst' }
  });
  console.log(apps);
}
main().catch(console.error).finally(() => prisma.$disconnect());
