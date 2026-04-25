import { prisma } from './lib/prisma';
async function main() {
  const apps = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: true, shop: true }
  });
  console.log(JSON.stringify(apps, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
