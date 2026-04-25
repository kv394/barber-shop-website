import { prisma } from './lib/prisma';

async function run() {
  const shop = await prisma.shop.findFirst({ where: { name: { contains: "missouri", mode: "insensitive" } } });
  if (!shop) return;
  const appts = await prisma.appointment.findMany({
    where: { shopId: shop.id },
    select: { id: true, startTime: true, status: true, user: { select: { name: true, role: true } } },
    orderBy: { startTime: 'desc' },
    take: 5
  });
  console.log("Recent appointments:", appts);
}

run().catch(console.error).finally(() => prisma.$disconnect());
