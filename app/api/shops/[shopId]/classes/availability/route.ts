import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { toShopTzDayBounds } from '@/lib/timezone';
import { z } from 'zod';

const schema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const dateStr = searchParams.get('date');

    const validationResult = schema.safeParse({ serviceId, date: dateStr });
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: validationResult.error.format() }, { status: 400 });
    }

    const tenantClient = await getTenantClient(shopId);

    const service = await tenantClient.service.findUnique({
      where: { id: serviceId! },
      select: { isGroupClass: true, maxCapacity: true }
    });

    if (!service || !service.isGroupClass) {
      return NextResponse.json({ error: 'Not a valid group class' }, { status: 400 });
    }

    // Determine the day of week in the shop's timezone
    const shop = await tenantClient.shop.findUnique({
      where: { id: shopId },
      select: { timezone: true }
    });
    const tz = shop?.timezone || 'America/New_York';
    const { startOfDay } = toShopTzDayBounds(dateStr!, tz);
    
    const localDateString = startOfDay.toLocaleString('en-US', { timeZone: tz });
    const localDate = new Date(localDateString);
    const dayOfWeek = localDate.getDay();

    // Fetch class schedules for this day
    const schedules = await tenantClient.classSchedule.findMany({
      where: { shopId, serviceId: serviceId!, dayOfWeek },
      include: { staff: { select: { id: true, name: true, imageUrl: true } } }
    });

    if (schedules.length === 0) {
      return NextResponse.json([]); // No classes on this day
    }

    // Build absolute times for today's classes
    const availableSlots = [];
    for (const schedule of schedules) {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      
      const classStartTime = new Date(startOfDay.getTime() + (hours * 60 + minutes) * 60000);

      const bookedCount = await tenantClient.appointment.count({
        where: {
          shopId,
          serviceId: serviceId!,
          startTime: classStartTime,
          status: { not: 'CANCELLED' }
        }
      });

      const maxCap = service.maxCapacity || 999;
      
      availableSlots.push({
        time: classStartTime.toISOString(),
        staffId: schedule.staffId,
        staffName: schedule.staff.name,
        availableSpots: Math.max(0, maxCap - bookedCount),
        maxCapacity: maxCap,
        isRecommended: false 
      });
    }

    availableSlots.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json(availableSlots);

  } catch (error) {
    logger.error("Error fetching class availability:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
