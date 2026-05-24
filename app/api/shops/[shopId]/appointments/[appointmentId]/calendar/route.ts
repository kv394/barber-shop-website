import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops/[shopId]/appointments/[appointmentId]/calendar
 * Returns a downloadable .ics (iCalendar) file for a specific appointment.
 * This allows clients to add their booking to Google Calendar, Apple Calendar, Outlook, etc.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string; appointmentId: string }> }
) {
  const { shopId, appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true, duration: true } },
      staff: { select: { name: true } },
      shop: { select: { name: true, customization: true, timezone: true } },
    },
  });

  if (!appointment || appointment.shopId !== shopId) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const shopName = appointment.shop?.name || 'Barbershop';
  const serviceName = appointment.service?.name || 'Appointment';
  const staffName = appointment.staff?.name || 'Staff';
  const customization = appointment.shop?.customization as any;
  const address = customization?.address || '';

  // Format dates for iCal (UTC format: YYYYMMDDTHHMMSSZ)
  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const dtStart = formatICalDate(appointment.startTime);
  const dtEnd = formatICalDate(appointment.endTime);
  const now = formatICalDate(new Date());

  // Build the .ics file content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kutz//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointmentId}@kutzapp.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${serviceName} at ${shopName}`,
    `DESCRIPTION:${serviceName} with ${staffName} at ${shopName}.${appointment.notes ? '\\n\\nNotes: ' + appointment.notes.replace(/\n/g, '\\n') : ''}`,
    address ? `LOCATION:${address.replace(/,/g, '\\,')}` : '',
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=${shopName}:mailto:noreply@kutzapp.com`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Your ${serviceName} appointment is in 1 hour`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Your ${serviceName} appointment is tomorrow`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${shopName.replace(/[^a-zA-Z0-9]/g, '-')}-booking.ics"`,
    },
  });
}
