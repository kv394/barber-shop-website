const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);
  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: shopId,
      startTime: { gte: today, lte: nextMonth },
    },
    include: {
      service: { select: { name: true, price: true, duration: true } },
      user: { select: { name: true, email: true } },
      staff: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 500,
  });
  console.log(JSON.stringify(appointments, null, 2));
}
main();
