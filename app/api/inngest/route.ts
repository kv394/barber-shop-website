import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processDailyTasks, processHourlyNotifications, generateHourlyUsageReports, processWinBackCampaigns, runDemoAutomation, analyzeSystemHealth, markNoShowAppointments, cleanupProcessedWebhooks } from '@/inngest/functions';
import { simulateLiveShop } from '@/inngest/simulate';
import { generateRecurringAppointments } from '@/inngest/generateRecurringAppointments';

// Create an API that serves zero-downtime background jobs and crons
export const { GET, POST, PUT } = serve({
 client: inngest,
 functions: [
 processDailyTasks,
 processHourlyNotifications,
 generateHourlyUsageReports,
 processWinBackCampaigns,
 simulateLiveShop,
 runDemoAutomation,
 analyzeSystemHealth,
 markNoShowAppointments,
 cleanupProcessedWebhooks,
 generateRecurringAppointments,
 ],
});
