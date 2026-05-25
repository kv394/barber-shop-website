import { inngest } from './client';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus, PaymentMethod } from '@prisma/client';

export const simulateLiveShop = inngest.createFunction(
  { id: 'simulate-live-shop', triggers: [{ cron: '*/30 * * * *' }] },
  async ({ step }) => {
    // 1. Find demo shops
    const adminEmails = ['admin@heritagehaircuts.com', 'admin@luxurynails.com'];
    const demoAdmins = await step.run('find-demo-shops', async () => {
      return await prisma.user.findMany({
        where: { email: { in: adminEmails } },
        include: { shop: true }
      });
    });

    const shopIds = demoAdmins.map((a: any) => a.shopId).filter((id: any): id is string => id !== null);

    if (!shopIds.length) {
      return { message: 'Demo shops not found.' };
    }

    // 2. Appointment Lifecycle Engine (Progress through statuses)
    const lifecycleResult = await step.run('process-appointment-lifecycle', async () => {
      const now = new Date();
      let updatedCount = 0;

      for (const shopId of shopIds) {
        // a) Client Arrived / In Chair: SCHEDULED -> ACCEPTED (if appointment is currently happening)
        const inProgress = await prisma.appointment.findMany({
          where: { shopId, status: AppointmentStatus.SCHEDULED, startTime: { lte: now }, endTime: { gt: now } }
        });
        for (const appt of inProgress) {
          await prisma.appointment.update({ where: { id: appt.id }, data: { status: AppointmentStatus.ACCEPTED } });
          updatedCount++;
        }

        // b) Cut Finished: ACCEPTED/SCHEDULED -> WORK_COMPLETED (if appointment end time just passed)
        const justFinished = await prisma.appointment.findMany({
          where: { shopId, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.ACCEPTED] }, endTime: { lte: now } }
        });
        for (const appt of justFinished) {
          await prisma.appointment.update({ where: { id: appt.id }, data: { status: AppointmentStatus.WORK_COMPLETED } });
          updatedCount++;
        }

        // c) Payment Received: WORK_COMPLETED -> COMPLETED (15 mins after cut finished)
        const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
        const awaitingPayment = await prisma.appointment.findMany({
          where: { shopId, status: AppointmentStatus.WORK_COMPLETED, endTime: { lte: fifteenMinsAgo } }
        });
        
        for (const appt of awaitingPayment) {
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { status: AppointmentStatus.COMPLETED }
          });

          await prisma.payment.create({
            data: {
              appointmentId: appt.id,
              amount: appt.totalAmount + appt.tipAmount,
              method: Math.random() > 0.5 ? 'CARD' : 'CASH',
              status: 'COMPLETED'
            }
          });
          updatedCount++;
        }
      }

      return updatedCount;
    });

    // 3. Walk-in & Booking Generator
    const walkInsGenerated = await step.run('generate-walk-ins', async () => {
      // 50% chance to generate a walk-in or new booking this run
      if (Math.random() > 0.5) return 0;
      
      let generatedCount = 0;

      for (const shopId of shopIds) {
        const clients = await prisma.user.findMany({ where: { shopId, role: 'CLIENT' } });
        const staff = await prisma.user.findMany({ where: { shopId, role: { in: ['STAFF', 'BOOTH_RENTER'] } } });
        const services = await prisma.service.findMany({ where: { shopId } });

        if (!clients.length || !staff.length || !services.length) continue;

        const client = clients[Math.floor(Math.random() * clients.length)];
        const provider = staff[Math.floor(Math.random() * staff.length)];
        const service = services[Math.floor(Math.random() * services.length)];

        const now = new Date();
        // Generate an appointment either today or tomorrow
        const daysAhead = Math.random() > 0.7 ? 1 : 0;
        // Random hour between 10am and 4pm
        const hour = Math.floor(Math.random() * 6) + 10;
        
        const startTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        startTime.setHours(hour, Math.random() > 0.5 ? 30 : 0, 0, 0);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);

        // Only create if it's in the future or very recent
        if (endTime > now) {
          await prisma.appointment.create({
            data: {
              shopId,
              userId: client.id,
              staffId: provider.id,
              serviceId: service.id,
              startTime,
              endTime,
              status: AppointmentStatus.SCHEDULED,
              totalAmount: service.price,
              subtotal: service.price,
            }
          });
          generatedCount++;
        }
      }
      return generatedCount;
    });

    // 4. Staff Operations: Clock-in if they have an active appointment right now
    const clockIns = await step.run('simulate-clock-ins', async () => {
      const now = new Date();
      // Look for appointments starting in the last hour or next hour
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      let newClockIns = 0;

      for (const shopId of shopIds) {
        const activeAppointments = await prisma.appointment.findMany({
          where: {
            shopId,
            startTime: { gte: oneHourAgo, lte: oneHourFromNow },
          },
          select: { staffId: true }
        });

        const activeStaffIds = Array.from(new Set(activeAppointments.map((a: any) => a.staffId)));
        
        // Ensure each active staff is clocked in for today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        for (const staffId of activeStaffIds) {
          const existingLog = await prisma.timeLog.findFirst({
            where: {
              shopId,
              userId: staffId,
              clockIn: { gte: todayStart }
            }
          });

          if (!existingLog) {
            // Clock them in
            const clockInTime = new Date(now);
            clockInTime.setMinutes(0, 0, 0); // e.g. 9:00am
            await prisma.timeLog.create({
              data: {
                shopId,
                userId: staffId,
                clockIn: clockInTime
              }
            });
            newClockIns++;
          }
        }
      }
      return newClockIns;
    });

    // 5. Process Referrals (Mock Data Logic)
    const referralsProcessed = await step.run('process-referrals', async () => {
      let processedCount = 0;
      
      for (const shopId of shopIds) {
        const pendingReferrals = await prisma.referral.findMany({
          where: {
            shopId,
            status: 'PENDING'
          }
        });

        for (const ref of pendingReferrals) {
          // Check if referee has completed an appointment
          const completedAppts = await prisma.appointment.count({
            where: {
              userId: ref.refereeId,
              shopId: ref.shopId,
              status: AppointmentStatus.COMPLETED
            }
          });

          if (completedAppts > 0) {
            // Mark as COMPLETED
            await prisma.referral.update({
              where: { id: ref.id },
              data: { status: 'COMPLETED' }
            });

            // Function to add points
            const addPoints = async (userId: string, points: number) => {
              let account = await prisma.loyaltyAccount.findUnique({
                where: { userId_shopId: { userId, shopId: ref.shopId } }
              });
              
              if (!account) {
                account = await prisma.loyaltyAccount.create({
                  data: { userId, shopId: ref.shopId, pointsBalance: 0, totalEarned: 0 }
                });
              }
              
              await prisma.loyaltyAccount.update({
                where: { id: account.id },
                data: {
                  pointsBalance: { increment: points },
                  totalEarned: { increment: points }
                }
              });
              
              await prisma.loyaltyTransaction.create({
                data: {
                  loyaltyAccountId: account.id,
                  points,
                  type: 'EARNED',
                  description: 'Referral bonus'
                }
              });
            };

            await addPoints(ref.referrerId, ref.referrerRewardPoints);
            await addPoints(ref.refereeId, ref.refereeRewardPoints);

            processedCount++;
          }
        }
      }

      return processedCount;
    });

    return { lifecycleResult, walkInsGenerated, clockIns, referralsProcessed };
  }
);
