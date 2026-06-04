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

/**
 * Automated No-Show Protection
 *
 * Runs every 15 minutes. Finds all SCHEDULED appointments whose startTime is
 * more than 15 minutes in the past and marks them as NO_SHOW. For appointments
 * with a deposit, logs the deposit capture intent. Notifies the shop admin.
 */
export const markNoShowAppointments = inngest.createFunction(
  { id: 'mark-no-show-appointments', triggers: [{ cron: '*/15 * * * *' }] },
  async ({ step }) => {
    const result = await step.run('find-and-mark-no-shows', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { getTenantClient } = await import('@/lib/prisma');
      const { NotificationService } = await import('@/lib/notifications');
      const { logger } = await import('@/lib/logger');

      const now = new Date();
      const cutoff = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

      // Find all overdue SCHEDULED appointments across all shops
      const overdueAppointments = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          startTime: { lt: cutoff },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          staff: { select: { id: true, name: true } },
          service: { select: { name: true } },
          shop: { select: { id: true, name: true } },
        },
      });

      let markedCount = 0;
      let depositFlaggedCount = 0;

      for (const appt of overdueAppointments) {
        // Use tenant-scoped client for the update
        const tenantDb = getTenantClient(appt.shopId);

        await tenantDb.appointment.update({
          where: { id: appt.id },
          data: { status: 'NO_SHOW' },
        });

        markedCount++;

        // Log deposit capture intent if applicable
        if (appt.depositPaymentIntentId && appt.depositAmount > 0) {
          // TODO: Implement actual Stripe deposit capture via stripe.paymentIntents.capture()
          // once the Stripe integration is wired up for no-show penalty collection.
          logger.info(
            `[NO_SHOW] Deposit should be captured for appointment ${appt.id}: ` +
            `paymentIntentId=${appt.depositPaymentIntentId}, amount=${appt.depositAmount}`
          );
          depositFlaggedCount++;
        }

        // Notify shop admin about the no-show
        const shopAdmin = await prisma.user.findFirst({
          where: {
            shopId: appt.shopId,
            role: 'SHOP_ADMIN',
          },
          select: { id: true },
        });

        if (shopAdmin) {
          const clientName = appt.user?.name || appt.user?.email || 'Unknown client';
          const serviceName = appt.service?.name || 'appointment';
          const staffName = appt.staff?.name || 'unassigned';
          const startFormatted = appt.startTime.toLocaleString();

          await NotificationService.send({
            shopId: appt.shopId,
            userId: shopAdmin.id,
            type: 'NO_SHOW',
            title: `No-Show: ${clientName}`,
            message:
              `${clientName} did not show up for their ${serviceName} ` +
              `with ${staffName} scheduled at ${startFormatted}.` +
              (appt.depositAmount > 0
                ? ` A deposit of $${appt.depositAmount.toFixed(2)} is flagged for capture.`
                : ''),
          });
        }
      }

      logger.info(
        `[NO_SHOW CRON] Processed ${markedCount} no-show(s), ` +
        `${depositFlaggedCount} deposit(s) flagged for capture.`
      );

      return { markedCount, depositFlaggedCount };
    });

    return result;
  }
);

/**
 * Webhook Cleanup Cron
 *
 * Runs daily at 3 AM UTC. Deletes all ProcessedWebhook records older than 30 days
 * to keep the idempotency table lean.
 */
export const cleanupProcessedWebhooks = inngest.createFunction(
  { id: 'cleanup-processed-webhooks', triggers: [{ cron: '0 3 * * *' }] },
  async ({ step }) => {
    const result = await step.run('delete-old-webhooks', async () => {
      const { prisma } = await import('@/lib/prisma');
      const { logger } = await import('@/lib/logger');

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const deleted = await prisma.processedWebhook.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      logger.info(
        `[WEBHOOK CLEANUP] Deleted ${deleted.count} processed webhook record(s) older than 30 days.`
      );

      return { deletedCount: deleted.count };
    });

    return result;
  }
);

export const monitorVercelLogs = inngest.createFunction(
  { id: 'monitor-vercel-logs', triggers: [{ cron: '*/10 * * * *' }] },
  async ({ step }) => {
    const result = await step.run('fetch-vercel-logs', async () => {
      const { VercelLogMonitor } = await import('@/lib/vercel-logs');
      return await VercelLogMonitor.fetchAndIngestLogs();
    });

    if (result && result.errorsFound > 0) {
      await step.run('alert-site-admins', async () => {
        const { prisma } = await import('@/lib/prisma');
        const { NotificationService } = await import('@/lib/notifications');
        const { logger } = await import('@/lib/logger');

        const siteAdmins = await prisma.user.findMany({
          where: { role: 'SITE_ADMIN' },
          select: { id: true, email: true },
        });

        if (siteAdmins.length === 0) {
          logger.warn('[Vercel Monitor Inngest] No SITE_ADMIN users found to alert.');
          return;
        }

        const shop = await prisma.shop.findFirst({ select: { id: true } });
        const shopId = shop?.id || 'demo-shop-001';

        for (const admin of siteAdmins) {
          logger.info(`[Vercel Monitor Inngest] Sending alert notification to SITE_ADMIN ${admin.email}`);
          await NotificationService.send({
            shopId,
            userId: admin.id,
            type: 'SYSTEM_ALERT',
            title: '⚠️ Vercel Errors Detected',
            message: `Vercel Log Monitor detected ${result.errorsFound} error(s) during the capture window. Please check the siteadmin dashboard for details.`,
          });
        }
      });
    }

    return result;
  }
);

