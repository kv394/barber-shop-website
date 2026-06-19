import { toShopTzDayBounds } from '@/lib/timezone';
import { getEmailProviderForShop } from '@/lib/messaging-providers';
import { logger } from '@/lib/logger';
import QRCode from 'qrcode';
import type { ToolHandlerContext, ToolHandlerResult } from '../types';

interface BookAppointmentArgs {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceLocation?: string;
  recurrenceRule?: string;
}

/**
 * Handles the book_appointment tool call.
 * Creates/finds user, books the appointment, generates QR code,
 * and fire-and-forgets a confirmation email with ICS calendar invite.
 */
export async function handleBookAppointment(
  args: BookAppointmentArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { serviceId, staffId, date, time, clientName, clientEmail, serviceLocation, recurrenceRule } = args;
  const { prisma, shop, realShopId, customization: c } = ctx;

  // Create dummy client user
  const emailToUse = (clientEmail || `guest-${Date.now()}@example.com`).trim().toLowerCase();

  // Search globally by email to avoid unique constraint violations
  let user = await prisma.user.findUnique({ where: { email: emailToUse } });

  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        email: emailToUse,
        name: clientName,
        role: 'CLIENT',
        shopId: realShopId,
        barcode: `C-${Date.now()}`
      }
    });
  }

  const shopTz = shop.timezone || 'America/New_York';
  const { startOfDay } = toShopTzDayBounds(date, shopTz);
  const [h, m] = time.split(':');
  const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);

  let service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service && serviceId) {
    service = await prisma.service.findFirst({ where: { shopId: realShopId, name: { contains: serviceId, mode: 'insensitive' } } });
  }

  let finalStaffId = staffId;
  if (staffId) {
    let staffCheck = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staffCheck) {
      staffCheck = await prisma.user.findFirst({ where: { shopId: realShopId, role: 'STAFF', name: { contains: staffId, mode: 'insensitive' } } });
      if (staffCheck) finalStaffId = staffCheck.id;
    }
  }

  if (!service) {
    return { result: { success: false, error: "Service not found" } };
  }

  const endTime = new Date(startTime.getTime() + service.duration * 60000);
  const apt = await prisma.appointment.create({
    data: {
      shopId: realShopId,
      serviceId: service.id,
      staffId: finalStaffId,
      userId: user.id,
      startTime,
      endTime,
      status: 'SCHEDULED',
      serviceLocation: serviceLocation || null,
      isRecurringParent: !!recurrenceRule,
      recurrenceRule: recurrenceRule || null,
      recurringGroupId: recurrenceRule ? crypto.randomUUID() : null,
    }
  });

  // Always generate QR code for check-in (not just new users)
  const lastQrCodeUrl = await QRCode.toDataURL(user.barcode || user.id);

  // Auto-send single confirmation email with QR code + calendar invite (fire-and-forget)
  if (clientEmail && !clientEmail.includes('guest-')) {
    const staffMember = await prisma.user.findUnique({ where: { id: finalStaffId }, select: { name: true } });
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: shopTz,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(startTime);
    // QR code attachment
    const qrBase64 = lastQrCodeUrl.replace(/^data:image\/png;base64,/, '');
    // Build ICS calendar invite
    const icsStartStr = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsEndStr = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kutz//EN',
      'BEGIN:VEVENT',
      `UID:${apt.id}@kutzapp.com`,
      `DTSTAMP:${icsStartStr}`,
      `DTSTART:${icsStartStr}`,
      `DTEND:${icsEndStr}`,
      `SUMMARY:${service.name} at ${shop.name}`,
      `DESCRIPTION:Your appointment for ${service.name} with ${staffMember?.name || 'Staff'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const confirmHtml = `<h1>Booking Confirmed ✅</h1>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your appointment has been confirmed!</p>
    <p><strong>Shop:</strong> ${shop.name}<br/>
    <strong>Service:</strong> ${service.name}<br/>
    <strong>Barber:</strong> ${staffMember?.name || 'Staff'}<br/>
    <strong>When:</strong> ${formattedDate}</p>
    <p>📎 <strong>Attached:</strong></p>
    <ul>
    <li>📅 Calendar invite (.ics) — add to your calendar</li>
    <li>📱 Check-in QR code — show when you arrive</li>
    </ul>
    <p>We look forward to seeing you!</p>`;
    const shopReplyTo = c.contact?.email || c.email || '';
    getEmailProviderForShop(realShopId).then(provider =>
      provider.send(
        clientEmail,
        `Appointment Confirmed at ${shop.name}`,
        `Your appointment for ${service.name} is confirmed for ${formattedDate}.`,
        confirmHtml,
        [
          { filename: 'appointment.ics', content: Buffer.from(icsContent).toString('base64'), type: 'text/calendar' },
          { filename: 'checkin-qrcode.png', content: qrBase64, type: 'image/png' }
        ],
        shop.name,
        shopReplyTo || undefined
      )
    ).catch(err => logger.error('Failed to send booking confirmation email:', err));
  }

  return {
    result: { success: true, appointmentId: apt.id, isNewUser },
    uiType: 'qr_code',
    qrCodeUrl: lastQrCodeUrl,
  };
}
