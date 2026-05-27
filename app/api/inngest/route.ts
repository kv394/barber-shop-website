import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processDailyTasks, processHourlyNotifications, generateHourlyUsageReports, queueAppointmentReminders, processWinBackCampaigns, runDemoAutomation } from '@/inngest/functions';
import { simulateLiveShop } from '@/inngest/simulate';

// Create an API that serves zero-downtime background jobs and crons
export const { GET, POST, PUT } = serve({
 client: inngest,
 functions: [
 processDailyTasks,
 processHourlyNotifications,
 generateHourlyUsageReports,
 queueAppointmentReminders,
 processWinBackCampaigns,
 simulateLiveShop,
 runDemoAutomation,
 ],
});
