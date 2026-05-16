import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string, staffId: string }> }) {
  const { shopId, staffId } = await params;
  
  const staff = await prisma.user.findFirst({
    where: { id: staffId, shopId: shopId },
    select: { name: true }
  });

  if (!staff) {
    return new Response('Not Found', { status: 404 });
  }

  // Get appointments for the next 60 days
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(now.getDate() + 60);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      staffId: staffId,
      shopId: shopId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // from 7 days ago
      endTime: { lte: maxDate }
    },
    include: {
      service: { select: { name: true } },
      user: { select: { name: true } },
      shop: { select: { name: true } }
    }
  });

  const formatDateForICal = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberSaaS//EN',
    `X-WR-CALNAME:${staff.name} Appointments`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  appointments.forEach((apt: any) => {
    const serviceName = apt.service?.name || 'Appointment';
    const clientName = apt.user?.name || 'Client';
    const shopName = apt.shop?.name || 'Shop';
    
    icalContent.push('BEGIN:VEVENT');
    icalContent.push(`UID:${apt.id}@barbersaas.com`);
    icalContent.push(`DTSTAMP:${formatDateForICal(new Date())}`);
    icalContent.push(`DTSTART:${formatDateForICal(new Date(apt.startTime))}`);
    icalContent.push(`DTEND:${formatDateForICal(new Date(apt.endTime))}`);
    icalContent.push(`SUMMARY:${serviceName} with ${clientName}`);
    icalContent.push(`DESCRIPTION:Appointment at ${shopName}`);
    icalContent.push('END:VEVENT');
  });

  icalContent.push('END:VCALENDAR');

  return new Response(icalContent.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="staff-${staffId}-calendar.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
