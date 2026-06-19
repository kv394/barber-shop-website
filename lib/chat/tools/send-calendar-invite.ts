import { getEmailProviderForShop } from '@/lib/messaging-providers';
import type { ToolHandlerContext, ToolHandlerResult } from '../types';

/**
 * Handles the send_calendar_invite tool call.
 * Generates an ICS calendar file and sends it via email.
 */
export async function handleSendCalendarInvite(
  args: { appointmentId: string; clientEmail: string },
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { appointmentId, clientEmail } = args;
  const { prisma, realShopId, customization: c } = ctx;

  if (!appointmentId || !clientEmail) {
    return { result: { error: "Missing appointmentId or clientEmail." } };
  }

  const apt = await prisma.appointment.findFirst({
    where: { id: appointmentId, shopId: realShopId },
    include: { service: true, shop: true }
  });

  if (!apt) {
    return { result: { error: "Appointment not found." } };
  }

  const startTime = apt.startTime;
  const endTime = apt.endTime;
  const startStr = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endStr = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kutz//EN',
    'BEGIN:VEVENT',
    `UID:${apt.id}@kutzapp.com`,
    `DTSTAMP:${startStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${apt.service?.name || 'Appointment'} at ${apt.shop.name}`,
    `DESCRIPTION:Your appointment for ${apt.service?.name || 'Service'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const emailProvider = await getEmailProviderForShop(realShopId);
  const emailRes = await emailProvider.send(
    clientEmail,
    `Calendar Invite: ${apt.service?.name || 'Appointment'} at ${apt.shop.name}`,
    `Hi! Please find your calendar invite attached for your upcoming appointment.`,
    undefined,
    [{ filename: 'invite.ics', content: Buffer.from(icsContent).toString('base64'), type: 'text/calendar' }],
    apt.shop.name,
    c.contact?.email || c.email || undefined
  );

  if (emailRes.success) {
    return { result: { message: "Calendar invite sent successfully." } };
  } else {
    return { result: { error: "Failed to send calendar invite." } };
  }
}
