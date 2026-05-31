import { prisma } from './prisma';

export class DemoAutomationService {
  static async processAutomation() {
    console.log('[DemoAutomation] Starting automation job...');
    const shop = await prisma.shop.findFirst({ where: { name: { contains: 'Luxury Nails & Spa' } } });
    if (!shop) {
      console.log('[DemoAutomation] Demo shop not found. Skipping.');
      return;
    }

    const now = new Date();
    const staff = await prisma.user.findMany({ where: { shopId: shop.id, role: 'STAFF' } });
    const clients = await prisma.user.findMany({ where: { shopId: shop.id, role: 'CLIENT' } });
    const services = await prisma.service.findMany({ where: { shopId: shop.id } });

    // 1. Mark past scheduled appointments as ACCEPTED (started)
    await prisma.appointment.updateMany({
      where: {
        shopId: shop.id,
        status: 'SCHEDULED',
        startTime: { lte: now }
      },
      data: { status: 'ACCEPTED' }
    });

    // 2. Complete appointments that are ACCEPTED and endTime has passed
    const toComplete = await prisma.appointment.findMany({
      where: {
        shopId: shop.id,
        status: 'ACCEPTED',
        endTime: { lte: now }
      }
    });

    for (const appt of toComplete) {
      const tipAmount = appt.subtotal * 0.20;
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          status: 'COMPLETED',
          tipAmount: tipAmount,
          totalAmount: appt.totalAmount + tipAmount
        }
      });

      // Add Payment
      await prisma.payment.create({
        data: {
          appointmentId: appt.id,
          amount: appt.totalAmount + tipAmount,
          method: Math.random() > 0.5 ? 'CARD' : 'CASH',
          status: 'COMPLETED'
        }
      });

      // Random review (30% chance)
      if (Math.random() < 0.3) {
        const comments = ['Amazing service!', 'Always on time and professional.', 'Loved my nails.', 'Will be back!'];
        await prisma.review.create({
          data: {
            rating: Math.floor(Math.random() * 2) + 4,
            comment: comments[Math.floor(Math.random() * comments.length)],
            appointmentId: appt.id,
            userId: appt.userId,
            shopId: shop.id
          }
        });
      }
    }

    // 3. Generate new future appointments
    if (staff.length > 0 && clients.length > 0 && services.length > 0) {
      const numNew = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numNew; i++) {
        const rStaff = staff[Math.floor(Math.random() * staff.length)];
        const rClient = clients[Math.floor(Math.random() * clients.length)];
        const rService = services[Math.floor(Math.random() * services.length)];

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + Math.floor(Math.random() * 7) + 1);
        targetDate.setHours(9 + Math.floor(Math.random() * 8), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);

        const endTime = new Date(targetDate);
        endTime.setMinutes(endTime.getMinutes() + rService.duration);

        await prisma.appointment.create({
          data: {
            shopId: shop.id,
            staffId: rStaff.id,
            userId: rClient.id,
            serviceId: rService.id,
            startTime: targetDate,
            endTime: endTime,
            status: 'SCHEDULED',
            subtotal: rService.price,
            taxAmount: rService.price * 0.08,
            totalAmount: rService.price * 1.08,
            tipAmount: 0
          }
        });
      }
    }

    // 4. Process Waitlist (Walk-ins)
    const currentHour = now.getHours();
    const isShopOpen = currentHour >= 9 && currentHour <= 18;

    if (isShopOpen) {
      const activeWaitlists = await prisma.waitlist.findMany({
        where: { shopId: shop.id, status: 'WAITING' }
      });

      // Assign staff to waitlist and create active appointments for them
      for (const wl of activeWaitlists) {
        if (Math.random() < 0.5 && staff.length > 0 && clients.length > 0) {
          const rStaff = staff[Math.floor(Math.random() * staff.length)];
          const rClient = clients[Math.floor(Math.random() * clients.length)];
          
          let duration = 30;
          let price = 0;
          if (wl.serviceId) {
            const svc = services.find((s: any) => s.id === wl.serviceId);
            if (svc) {
              duration = svc.duration;
              price = svc.price;
            }
          }

          const endTime = new Date(now);
          endTime.setMinutes(endTime.getMinutes() + duration);

          // Mark as COMPLETED and assigned to staff
          await prisma.waitlist.update({
            where: { id: wl.id },
            data: { 
              status: 'COMPLETED', 
              staffId: rStaff.id,
              updatedAt: new Date() 
            }
          });

          // Create the actual working appointment
          await prisma.appointment.create({
            data: {
              shopId: shop.id,
              staffId: rStaff.id,
              userId: rClient.id,
              serviceId: wl.serviceId,
              startTime: now,
              endTime: endTime,
              status: 'ACCEPTED', // Means staff is working on it
              subtotal: price,
              taxAmount: price * 0.08,
              totalAmount: price * 1.08,
              tipAmount: 0
            }
          });
        }
      }

      // Generate new walk-ins
      if (Math.random() < 0.7 && services.length > 0) {
        const numWalkins = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numWalkins; i++) {
          const rService = services[Math.floor(Math.random() * services.length)];
          const lastWaitlist = await prisma.waitlist.findFirst({
            where: { shopId: shop.id },
            orderBy: { position: 'desc' }
          });
          const nextPos = (lastWaitlist?.position || 0) + 1;

          await prisma.waitlist.create({
            data: {
              shopId: shop.id,
              clientName: `Walk-in ${Math.floor(Math.random() * 1000)}`,
              clientPhone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
              serviceId: rService.id,
              partySize: Math.floor(Math.random() * 2) + 1,
              position: nextPos,
              status: 'WAITING'
            }
          });
        }
      }
    } else {
      await prisma.waitlist.updateMany({
        where: { shopId: shop.id, status: 'WAITING' },
        data: { status: 'CANCELLED' }
      });
    }

    console.log('[DemoAutomation] Finished automation job.');
    return { completed: toComplete.length };
  }
}
