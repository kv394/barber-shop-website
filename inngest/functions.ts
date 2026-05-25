import { inngest } from './client';
import { NotificationService } from '@/lib/notifications';
import { LoyaltyService } from '@/lib/loyalty';
import { UsageService } from '@/lib/usage-service';
import { RebookingService } from '@/lib/rebooking-prompts';
import { DemoAutomationService } from '@/lib/demo-automation';

export const processDailyTasks = inngest.createFunction(
  { id: 'process-daily-tasks', triggers: [{ cron: '0 0 * * *' }] },
  async ({ step }) => {
    // 1. Process pending + retry failed notifications
    const notificationsProcessed = await step.run('process-scheduled-notifications', async () => {
      return await NotificationService.processScheduled();
    });

    // 2. Expire old loyalty points
    const pointsExpired = await step.run('process-point-expiry', async () => {
      return await LoyaltyService.processPointExpiry();
    });

    // 3. Process predictive rebooking prompts ("Time for a trim?")
    const rebookingPromptsQueued = await step.run('process-rebooking-prompts', async () => {
      return await RebookingService.processAllShops();
    });

    return { notificationsProcessed, pointsExpired, rebookingPromptsQueued };
  }
);

export const processHourlyNotifications = inngest.createFunction(
  { id: 'process-hourly-notifications', triggers: [{ cron: '*/15 * * * *' }] },
  async ({ step }) => {
    // Run every 15 minutes to ensure appointment reminders (24h & 1h before) fire on time
    const notificationsProcessed = await step.run('process-scheduled-notifications', async () => {
      return await NotificationService.processScheduled();
    });
    return { notificationsProcessed };
  }
);

export const generateHourlyUsageReports = inngest.createFunction(
  { id: 'generate-hourly-usage-reports', triggers: [{ cron: '0 * * * *' }] },
  async ({ step }) => {
    const usageReportsGenerated = await step.run('generate-usage-reports', async () => {
      return await UsageService.generateHourlyReports();
    });
    return { usageReportsGenerated };
  }
);

export const queueAppointmentReminders = inngest.createFunction(
  { id: 'queue-appointment-reminders', triggers: [{ cron: '0 * * * *' }] },
  async ({ step }) => {
    const remindersQueued = await step.run('queue-reminders', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { NotificationService } = await import('@/lib/notifications');
      const crypto = await import('crypto');

      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      // We look for appointments exactly in the next hour block for 24h and 2h
      // E.g. if it's 2:00 PM, we look for appointments between 2:00 PM and 2:59 PM tomorrow
      
      const findAndQueue = async (targetStart: Date, label: string) => {
        const targetEnd = new Date(targetStart.getTime() + 59 * 60 * 1000 + 59000); // end of the hour
        
        const appointments = await prisma.appointment.findMany({
          where: {
            status: 'SCHEDULED',
            startTime: { gte: targetStart, lte: targetEnd }
          },
          include: { staff: true, shop: true }
        });

        let queued = 0;
        for (const appt of appointments) {
          // Generate a management token if it doesn't exist
          let token = appt.managementToken;
          if (!token) {
            token = crypto.randomBytes(16).toString('hex');
            await prisma.appointment.update({
              where: { id: appt.id },
              data: { managementToken: token }
            });
          }

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kutzapp.com';
          const manageUrl = `${appUrl}/manage/${token}`;
          const timeString = new Date(appt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

          await NotificationService.send({
            shopId: appt.shopId,
            userId: appt.userId,
            type: 'APPOINTMENT_REMINDER',
            title: `Reminder: Appointment ${label}`,
            message: `Your haircut with ${appt.staff.name || 'your stylist'} at ${appt.shop.name} is ${label} at ${timeString}. Manage booking: ${manageUrl}`,
          });
          queued++;
        }
        return queued;
      };

      const queued24h = await findAndQueue(in24Hours, 'tomorrow');
      const queued2h = await findAndQueue(in2Hours, 'in 2 hours');

      return queued24h + queued2h;
    });

    return { remindersQueued };
  }
);

export const processWinBackCampaigns = inngest.createFunction(
  { id: 'process-win-back-campaigns', triggers: [{ cron: '0 12 * * *' }] }, // Runs daily at noon UTC
  async ({ step }) => {
    const sentCount = await step.run('send-win-back', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { NotificationService } = await import('@/lib/notifications');

      const now = new Date();
      // Target 6 weeks ago (42 days)
      const targetDate = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find clients whose last completed appointment was within the target day
      // and who haven't had a win-back sent recently (in the last 30 days at least)
      const targetClients = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          OR: [
            { winBackSentAt: null },
            { winBackSentAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }
          ],
          clientAppointments: {
            some: {
              status: 'COMPLETED',
              startTime: { gte: startOfDay, lte: endOfDay }
            },
            none: {
              status: 'SCHEDULED',
              startTime: { gt: now }
            }
          }
        },
        include: {
          shop: true,
          clientAppointments: {
            where: { status: 'COMPLETED' },
            orderBy: { startTime: 'desc' },
            take: 1,
            include: { staff: true }
          }
        }
      });

      let sent = 0;
      for (const client of targetClients) {
        if (!client.shopId) continue;
        const lastAppt = client.clientAppointments[0];
        if (!lastAppt) continue;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kutzapp.com';
        const bookingUrl = `${appUrl}/sites/${client.shopId}`;

        await NotificationService.send({
          shopId: client.shopId,
          userId: client.id,
          type: 'CAMPAIGN',
          title: 'We Miss You!',
          message: `It's been a while since your last cut with ${lastAppt.staff.name || 'us'}! Time for a fresh look? Book here: ${bookingUrl}`,
        });

        await prisma.user.update({
          where: { id: client.id },
          data: { winBackSentAt: now }
        });

        sent++;
      }

      return sent;
    });

    return { sentCount };
  }
);

export const runDemoAutomation = inngest.createFunction(
  { id: 'run-demo-automation', triggers: [{ cron: '*/30 * * * *' }] },
  async ({ step }) => {
    const processed = await step.run('process-demo-automation', async () => {
      return await DemoAutomationService.processAutomation();
    });
    return { processed };
  }
);
