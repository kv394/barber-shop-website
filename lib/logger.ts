export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? meta : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? meta : '');
  },
  /**
   * Logs an error and proactively pushes it to a Slack/Discord webhook if configured.
   */
  error: async (message: string, error?: any, context?: { shopId?: string; userId?: string; path?: string }) => {
    console.error(`[ERROR] ${message}`);
    if (error) console.error(error);
    
    const errorMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    const stackTrace = error instanceof Error ? error.stack : 'No stack trace';

    // Next.js uses errors to control dynamic rendering bailout. Do not log them to the database, and do not crash the build!
    if (errorMsg.includes('Dynamic server usage') || error?.digest === 'DYNAMIC_SERVER_USAGE' || message.includes('rendered statically')) {
      return;
    }

    // Store in Database if possible
    try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                message: message,
                stack: stackTrace,
                path: context?.path,
                shopId: context?.shopId,
                userId: context?.userId,
                metadata: error ? JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) : undefined
            }
        });
    } catch (dbErr) {
        console.error('Failed to write error to database:', dbErr);
    }

    // Proactive reporting via Webhook
    const webhookUrl = process.env.ERROR_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        let markdownBody = `🚨 **Error Alert** 🚨\n**Message:** ${message}\n`;
        
        if (context?.shopId) markdownBody += `**Shop ID:** ${context.shopId}\n`;
        if (context?.userId) markdownBody += `**User ID:** ${context.userId}\n`;
        if (context?.path) markdownBody += `**Path:** ${context.path}\n`;
        
        markdownBody += `\n**Details:** ${errorMsg || 'None'}\n`;
        markdownBody += `**Stack:** \`\`\`${stackTrace}\`\`\``;

        // Slack format uses 'text', Discord uses 'content'
        const payload = webhookUrl.includes('slack.com') 
          ? { text: markdownBody } 
          : { content: markdownBody }; // Default to Discord-compatible

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to send webhook:', err));

      } catch (webhookErr) {
        console.error('Failed to prepare error webhook:', webhookErr);
      }
    }
  }
};
