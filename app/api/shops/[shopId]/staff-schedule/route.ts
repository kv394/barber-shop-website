import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Date query param required' }, { status: 400 });
  const fromParam = url.searchParams.get('from') || '00:00';
  const toParam = url.searchParams.get('to') || '23:59';
  const [filterFromHour, filterFromMin] = fromParam.split(':').map(Number);
  const [filterToHour, filterToMin] = toParam.split(':').map(Number);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== 'SUPER_ADMIN' && user.shopId !== params.shopId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const shop = await prisma.shop.findUnique({ where: { id: params.shopId } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const targetDate = new Date(date);
  const rolesToFetch: ('SHOP_ADMIN' | 'STAFF')[] = user.role === 'SUPER_ADMIN' ? ['SHOP_ADMIN'] : ['SHOP_ADMIN', 'STAFF'];
  const allStaff = await prisma.user.findMany({
    where: { shopId: params.shopId, role: { in: rolesToFetch } },
    include: {
      staffAppointments: {
        where: {
          startTime: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      leaves: { where: { date: targetDate } },
    },
  });

  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getUTCDay()];

  const staffWithSchedule = allStaff.map((staff) => {
    const individualHours = (staff.workingHours as any) || {};
    let hoursForDay = individualHours[dayOfWeek];
    const isExplicitlyOff = hoursForDay === null;

    if (isExplicitlyOff) {
      return { ...staff, schedule: [], isOnLeave: false, using: 'not-working', dayOfWeek, openTime: null, closeTime: null, isWorking: false, workingHours: individualHours };
    }

    if (!hoursForDay) hoursForDay = (shop.customization as any)?.businessHours?.[dayOfWeek];

    if (!hoursForDay) {
      return { ...staff, schedule: [], isOnLeave: false, using: 'not-set', dayOfWeek, openTime: '09:00', closeTime: '17:00', isWorking: false, workingHours: individualHours };
    }

    const schedule: { time: string; isBooked: boolean; isOnLeave: boolean }[] = [];
    const [openHour, openMin] = hoursForDay.open.split(':').map(Number);
    const [closeHour, closeMin] = hoursForDay.close.split(':').map(Number);
    const currentSlotTime = new Date(targetDate);
    currentSlotTime.setUTCHours(openHour, openMin, 0, 0);
    const closingTime = new Date(targetDate);
    closingTime.setUTCHours(closeHour, closeMin, 0, 0);

    while (currentSlotTime < closingTime) {
      const slotHour = currentSlotTime.getUTCHours();
      const slotMin = currentSlotTime.getUTCMinutes();

      // Filter by from/to time range
      if (slotHour > filterToHour || (slotHour === filterToHour && slotMin >= filterToMin)) break;

      if (slotHour > filterFromHour || (slotHour === filterFromHour && slotMin >= filterFromMin)) {
        const slotEndTime = new Date(currentSlotTime.getTime() + 30 * 60000);
        const booking = staff.staffAppointments.find(
          (apt) => new Date(apt.startTime) < slotEndTime && new Date(apt.endTime) > currentSlotTime
        );
        const onLeave = staff.leaves.find(
          (l) => new Date(l.startTime) < slotEndTime && new Date(l.endTime) > currentSlotTime
        );
        schedule.push({
          time: currentSlotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
          isBooked: !!booking,
          isOnLeave: !!onLeave,
        });
      }
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
    }

    return {
      ...staff,
      schedule,
      isOnLeave: staff.leaves.length > 0,
      dayOfWeek,
      openTime: hoursForDay.open,
      closeTime: hoursForDay.close,
      isWorking: true,
      workingHours: individualHours,
    };
  });

  return NextResponse.json({
    staff: JSON.parse(JSON.stringify(staffWithSchedule)),
  });
}

