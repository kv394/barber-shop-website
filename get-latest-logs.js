const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to get logs:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
