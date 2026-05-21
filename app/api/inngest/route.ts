import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processDailyTasks, generateHourlyUsageReports } from '@/inngest/functions';

// Create an API that serves zero-downtime background jobs and crons
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDailyTasks,
    generateHourlyUsageReports,
  ],
});
