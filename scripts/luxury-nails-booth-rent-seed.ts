import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- STARTING LUXURY NAILS BOOTH RENT SEED ---');
  
  const shop = await prisma.shop.findFirst({
    where: { name: { contains: 'Luxury Nails' } }
  });

  if (!shop) {
    console.error('Could not find Luxury Nails & Spa shop.');
    return;
  }

  const shopId = shop.id;

  // Create booth renters if they don't exist
  const rentersData = [
    {
      email: 'lisa@luxurynails.com',
      name: 'Lisa (Booth Renter)',
      role: 'BOOTH_RENTER' as const,
      phone: '+15550200001',
      stripeConnectOnboarded: true,
      employmentType: 'CONTRACTOR' as const,
      boothRentAmount: 400.00,
      boothRentInterval: 'WEEKLY' as const,
      shopId
    },
    {
      email: 'michelle@luxurynails.com',
      name: 'Michelle (Contractor)',
      role: 'BOOTH_RENTER' as const,
      phone: '+15550200002',
      stripeConnectOnboarded: true,
      employmentType: 'CONTRACTOR' as const,
      boothRentAmount: 1600.00,
      boothRentInterval: 'MONTHLY' as const,
      shopId
    }
  ];

  const contractors = [];
  for (const rData of rentersData) {
    const user = await prisma.user.upsert({
      where: { email: rData.email },
      update: {
        role: 'BOOTH_RENTER',
        employmentType: 'CONTRACTOR',
        boothRentAmount: rData.boothRentAmount,
        boothRentInterval: rData.boothRentInterval
      },
      create: rData
    });
    contractors.push(user);
  }

  console.log(`Ensured ${contractors.length} booth renters for Luxury Nails.`);

  // Generate Booth Rent Payments
  console.log('Generating Booth Rent Payments...');
  
  // Clear old ones just in case
  await prisma.boothRentPayment.deleteMany({
    where: { shopId, userId: { in: contractors.map(c => c.id) } }
  });

  const rentPayments = [];
  for (const c of contractors) {
    const amount = c.boothRentAmount || 400;
    const isWeekly = c.boothRentInterval === 'WEEKLY';
    
    // Create completed payments
    if (isWeekly) {
      rentPayments.push({ shopId, userId: c.id, amount, periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), periodEnd: new Date(), status: 'COMPLETED', paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) });
      rentPayments.push({ shopId, userId: c.id, amount, periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), periodEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'COMPLETED', paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) });
    } else {
      rentPayments.push({ shopId, userId: c.id, amount, periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), periodEnd: new Date(), status: 'COMPLETED', paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) });
      rentPayments.push({ shopId, userId: c.id, amount, periodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), periodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'COMPLETED', paidAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) });
    }
  }

  await prisma.boothRentPayment.createMany({ data: rentPayments as any });

  console.log('--- LUXURY NAILS BOOTH RENT SEED COMPLETE ---');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
