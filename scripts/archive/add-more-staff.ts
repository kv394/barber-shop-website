import { prisma } from '../lib/prisma';

async function main() {
  console.log('Adding more staff to Heritage Haircuts...');

  // Find the shop we created earlier
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@heritagehaircuts.com' },
    include: { shop: true }
  });

  if (!admin || !admin.shopId) {
    console.error('Could not find existing Heritage Haircuts shop. Did the seed run?');
    return;
  }

  const shopId = admin.shopId;

  // Add Sarah (W2)
  const staff2 = await prisma.user.upsert({
    where: { email: 'sarah@heritagehaircuts.com' },
    update: {},
    create: {
      email: 'sarah@heritagehaircuts.com',
      name: 'Sarah "The Stylist" Lee',
      role: 'STAFF',
      shopId: shopId,
      phone: '+15550100004',
      workingHours: {
        wednesday: { open: '10:00', close: '18:00' },
        thursday: { open: '10:00', close: '18:00' },
        friday: { open: '10:00', close: '19:00' },
        saturday: { open: '09:00', close: '17:00' }
      }
    }
  });

  // Add Dave (Contractor)
  const renter2 = await prisma.user.upsert({
    where: { email: 'dave@heritagehaircuts.com' },
    update: {},
    create: {
      email: 'dave@heritagehaircuts.com',
      name: 'Dave (Contractor)',
      role: 'BOOTH_RENTER',
      shopId: shopId,
      phone: '+15550100005',
      stripeConnectOnboarded: true,
      workingHours: {
        monday: { open: '08:00', close: '14:00' },
        tuesday: { open: '08:00', close: '14:00' },
        wednesday: { open: '08:00', close: '14:00' },
        thursday: { open: '08:00', close: '14:00' },
        friday: { open: '08:00', close: '14:00' }
      }
    }
  });

  console.log('Added Sarah and Dave!');

  // Re-assign some future appointments to them so they have data
  const futureAppts = await prisma.appointment.findMany({
    where: { 
      shopId, 
      status: 'SCHEDULED'
    },
    take: 10
  });

  let count = 0;
  for (let i = 0; i < futureAppts.length; i++) {
    const newStaffId = i % 2 === 0 ? staff2.id : renter2.id;
    await prisma.appointment.update({
      where: { id: futureAppts[i].id },
      data: { staffId: newStaffId }
    });
    count++;
  }

  console.log(`Re-assigned ${count} appointments to the new staff.`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
