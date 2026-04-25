const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.saaSTier.upsert({
    where: { name: 'Solo Pro' },
    update: {
      baseFeeUSD: 19.99,
      maxAppointments: 9999999, // unlimited
      maxUsers: 1,
      maxFormSubmissions: 9999999,
      storageLimitMB: 5000, // generous for a solo
      description: 'Zero transaction fees. Perfect for independent booth renters and solo operators.',
    },
    create: {
      name: 'Solo Pro',
      baseFeeUSD: 19.99,
      maxAppointments: 9999999,
      maxUsers: 1,
      maxFormSubmissions: 9999999,
      storageLimitMB: 5000,
      description: 'Zero transaction fees. Perfect for independent booth renters and solo operators.',
    }
  });
  console.log("Solo Pro tier created successfully!");
  process.exit(0);
}
run();
