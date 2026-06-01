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

export const analyzeSystemHealth = inngest.createFunction(
  { id: 'analyze-system-health', triggers: [{ cron: '*/30 * * * *' }] },
  async ({ step }) => {
    const analysis = await step.run('run-ai-sre-analysis', async () => {
      const { AISreService } = await import('@/lib/ai-sre');
      return await AISreService.analyzeLogsAndAlert();
    });
    return { analysis };
  }
);
