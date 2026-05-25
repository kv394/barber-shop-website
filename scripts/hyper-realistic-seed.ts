import { prisma } from '../lib/prisma';
import { PaymentMethod, PaymentStatus, AppointmentStatus, OrderStatus } from '@prisma/client';

async function main() {
  console.log('--- STARTING HYPER-REALISTIC SEED ---');
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@heritagehaircuts.com' }
  });

  if (!admin || !admin.shopId) {
    console.error('Could not find existing Heritage Haircuts shop.');
    return;
  }

  const shopId = admin.shopId;
  const staff = await prisma.user.findMany({ where: { shopId, role: { in: ['STAFF', 'BOOTH_RENTER'] } } });
  const clients = await prisma.user.findMany({ where: { shopId, role: 'CLIENT' } });
  const services = await prisma.service.findMany({ where: { shopId } });
  
  if (clients.length === 0 || staff.length === 0 || services.length === 0) {
    console.error('Missing base data.');
    return;
  }

  console.log('1. Generating Service Addons...');
  await prisma.serviceAddon.deleteMany({ where: { shopId } });
  
  const hotTowel = await prisma.serviceAddon.create({
    data: { shopId, name: 'Hot Towel Treatment', price: 10, durationMin: 10 }
  });
  const wash = await prisma.serviceAddon.create({
    data: { shopId, name: 'Premium Hair Wash', price: 15, durationMin: 15 }
  });

  for (const s of services) {
    await prisma.service.update({
      where: { id: s.id },
      data: {
        addons: {
          connect: [{ id: hotTowel.id }, { id: wash.id }]
        }
      }
    });
  }

  console.log('2. Generating High-Volume Appointments (100+ past, 50 upcoming)...');
  await prisma.appointmentItem.deleteMany({ where: { appointment: { shopId } } });
  await prisma.payment.deleteMany({ where: { appointment: { shopId } } });
  // We keep the old 10, but let's add 150 more
  const newAppointments = [];
  
  // Past 30 days
  for (let i = 0; i < 150; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hour = Math.floor(Math.random() * 8) + 9; // 9am to 5pm
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    date.setHours(hour, 0, 0, 0);
    const client = clients[Math.floor(Math.random() * clients.length)];
    const provider = staff[Math.floor(Math.random() * staff.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    
    // Some are cancelled or no show, mostly completed
    const rand = Math.random();
    let status = AppointmentStatus.COMPLETED;
    if (rand > 0.95) status = AppointmentStatus.NO_SHOW;
    else if (rand > 0.9) status = AppointmentStatus.CANCELLED;

    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        userId: client.id,
        staffId: provider.id,
        serviceId: service.id,
        startTime: date,
        endTime: new Date(date.getTime() + service.duration * 60000),
        status,
        totalAmount: service.price,
        subtotal: service.price,
        tipAmount: status === 'COMPLETED' ? Math.floor(Math.random() * 10) + 5 : 0,
      }
    });

    if (status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: appointment.totalAmount + appointment.tipAmount,
          method: Math.random() > 0.5 ? 'CARD' : 'CASH',
          status: 'COMPLETED'
        }
      });
    }
  }

  // Upcoming 7 days
  for (let i = 0; i < 50; i++) {
    const daysAhead = Math.floor(Math.random() * 7) + 1;
    const hour = Math.floor(Math.random() * 8) + 9;
    const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    date.setHours(hour, 0, 0, 0);
    const client = clients[Math.floor(Math.random() * clients.length)];
    const provider = staff[Math.floor(Math.random() * staff.length)];
    const service = services[Math.floor(Math.random() * services.length)];

    await prisma.appointment.create({
      data: {
        shopId,
        userId: client.id,
        staffId: provider.id,
        serviceId: service.id,
        startTime: date,
        endTime: new Date(date.getTime() + service.duration * 60000),
        status: AppointmentStatus.SCHEDULED,
        totalAmount: service.price,
        subtotal: service.price,
      }
    });
  }

  console.log('3. Generating HR Data (TimeLog, Leave)...');
  await prisma.timeLog.deleteMany({ where: { shopId } });
  await prisma.leave.deleteMany({ where: { shopId } });
  
  const timeLogs = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    for (const provider of staff) {
      if (Math.random() > 0.2) { // 80% chance they worked that day
        const clockIn = new Date(date);
        clockIn.setHours(8, 45, 0, 0);
        const clockOut = new Date(date);
        clockOut.setHours(17, 15, 0, 0);
        timeLogs.push({ shopId, userId: provider.id, clockIn, clockOut });
      }
    }
  }
  await prisma.timeLog.createMany({ data: timeLogs });

  await prisma.leave.create({
    data: {
      shopId,
      userId: staff[0].id,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      reason: 'Family Vacation'
    }
  });

  console.log('4. Generating CRM Data (ClientFormula, Message, Referral)...');
  await prisma.clientFormula.deleteMany({ where: { shopId } });
  await prisma.message.deleteMany({ where: { shopId } });
  await prisma.referral.deleteMany({ where: { shopId } });

  await prisma.clientFormula.create({
    data: { shopId, clientId: clients[0].id, staffId: staff[0].id, formula: 'Level 4 Dark Brown, 20 Volume Developer, process for 30 mins', notes: 'Client has sensitive scalp' }
  });

  await prisma.message.createMany({
    data: [
      { shopId, senderId: clients[1].id, content: 'Hey, I am running 5 minutes late!', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { shopId, senderId: admin.id, content: 'No problem, thanks for letting us know. See you soon!', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) }
    ]
  });

  await prisma.referral.create({
    data: { shopId, referrerId: clients[2].id, refereeId: clients[3].id, status: 'COMPLETED' }
  });

  console.log('5. Generating Inventory & Notifications (PurchaseOrder, Notification)...');
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { shopId } } });
  await prisma.purchaseOrder.deleteMany({ where: { shopId } });
  await prisma.notification.deleteMany({ where: { shopId } });

  const supplier = 'Barber Supply Co.';
  const po = await prisma.purchaseOrder.create({
    data: { shopId, supplier: supplier, status: 'RECEIVED', totalAmount: 150.00, orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  });

  const products = await prisma.product.findMany({ where: { shopId } });
  if (products.length > 0) {
    await prisma.purchaseOrderItem.create({
      data: { purchaseOrderId: po.id, productId: products[0].id, quantity: 10, unitCost: 15.00 }
    });
  }

  await prisma.notification.createMany({
    data: [
      { shopId, userId: admin.id, type: 'SYSTEM', title: 'Low Inventory Alert', message: 'Premium Shave Gel is running low.', status: 'PENDING' },
      { shopId, userId: admin.id, type: 'SYSTEM', title: 'New 5-Star Review', message: 'You just received a new 5-star review from Mike.', status: 'SENT' }
    ]
  });

  console.log('--- HYPER-REALISTIC SEED COMPLETE ---');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
