import { inngest } from './client';
import { NotificationService } from '@/lib/notifications';
import { LoyaltyService } from '@/lib/loyalty';
import { UsageService } from '@/lib/usage-service';
import { RebookingService } from '@/lib/rebooking-prompts';

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
