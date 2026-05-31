import { getTenantClient } from '@/lib/prisma';

/** Send an email */
export async function sendEmail(args: { to: string; subject: string; body: string }, shopId: string) {
  // Placeholder: integrate with your email provider (e.g., SendGrid). Here we just log.
  console.log(`Sending email to ${args.to}: ${args.subject}`);
  return { success: true };
}

/** Send an SMS */
export async function sendSMS(args: { to: string; message: string }, shopId: string) {
  // Placeholder: integrate with your SMS provider (e.g., Twilio). Here we just log.
  console.log(`Sending SMS to ${args.to}: ${args.message}`);
  return { success: true };
}

/** List stored notification templates */
export async function listTemplates(_args: {}, shopId: string) {
  const db = await getTenantClient(shopId);
  const templates = await db.notification.findMany({ where: { shopId } });
  return templates;
}
