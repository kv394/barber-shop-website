import { toShopTzDayBounds } from '@/lib/timezone';
import { getCalendarBusySlots } from '@/lib/google-calendar';
import { scoreAndSortSlots } from '@/lib/schedule-optimizer';
import type { ToolHandlerContext, ToolHandlerResult } from '../types';

/**
 * Handles the check_availability tool call.
 * Looks up available time slots for a given date, service, and optional staff member.
 * Integrates with Google Calendar busy slots and scores results for gap-fill efficiency.
 */
export async function handleCheckAvailability(
  args: { date: string; serviceId: string; staffId?: string },
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { date, serviceId, staffId } = args;
  const { prisma, shop, realShopId } = ctx;

  let service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service && serviceId) {
    // Fallback to name search in case LLM passes name instead of ID
    service = await prisma.service.findFirst({ where: { shopId: realShopId, name: { contains: serviceId, mode: 'insensitive' } } });
  }

  if (!service) {
    return { result: { error: "Service not found. Ensure you provided a valid service ID or name." } };
  }

  const shopTz = shop.timezone || 'America/New_York';
  const { startOfDay, endOfDay } = toShopTzDayBounds(date, shopTz);

  const appointments = await prisma.appointment.findMany({
    where: { shopId: realShopId, startTime: { gte: startOfDay, lt: endOfDay }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
    select: { startTime: true, endTime: true, staffId: true }
  });

  let targetStaff: any[] = [];
  if (staffId) {
    targetStaff = await prisma.user.findMany({
      where: { shopId: realShopId, role: 'STAFF', id: staffId }
    });
    if (targetStaff.length === 0) {
      // Fallback to searching by staff name
      targetStaff = await prisma.user.findMany({
        where: { shopId: realShopId, role: 'STAFF', name: { contains: staffId, mode: 'insensitive' } }
      });
    }
  }
  if (targetStaff.length === 0) {
    targetStaff = await prisma.user.findMany({ where: { shopId: realShopId, role: 'STAFF' } });
  }

  const googleBusySlotsPromises = targetStaff.map(async (st: any) => {
    const busySlots = await getCalendarBusySlots(st.id, startOfDay, endOfDay);
    return busySlots.map((slot: any) => ({ startTime: slot.startTime, endTime: slot.endTime, staffId: st.id }));
  });
  const googleBusySlotsNested = await Promise.all(googleBusySlotsPromises);
  const allBusySlots = [...appointments, ...googleBusySlotsNested.flat()];

  const generatedSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (const min of [0, 30]) {
      if (hour === 17 && min === 30) continue;

      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const slotStartTime = new Date(startOfDay.getTime() + (hour * 60 + min) * 60000);
      const slotEndTime = new Date(slotStartTime.getTime() + service.duration * 60000);

      let isAvailable = false;
      let availableStaffId = null;

      for (const st of targetStaff) {
        const staffBusy = allBusySlots.filter(s => s.staffId === st.id);
        const hasOverlap = staffBusy.some(bs => slotStartTime < bs.endTime && slotEndTime > bs.startTime);
        if (!hasOverlap) {
          isAvailable = true;
          availableStaffId = st.id;
          break;
        }
      }

      if (isAvailable) {
        generatedSlots.push({ time: timeStr, staffId: staffId || availableStaffId, available: true });
      }
    }
  }

  if (generatedSlots.length === 0) {
    return { result: { message: "No available slots on this date. Please try another date." } };
  }

  // Score and sort slots by gap-fill efficiency
  const scoredSlots = scoreAndSortSlots(
    generatedSlots.map(s => ({ time: s.time, staffId: s.staffId || '' })),
    allBusySlots.map(b => ({ startTime: b.startTime, endTime: b.endTime, staffId: b.staffId })),
    date,
    service.duration
  );

  return {
    result: {
      availableSlots: scoredSlots.map(s => ({ time: s.time, staffId: s.staffId, isRecommended: s.isRecommended })),
      message: "Returning available slots to the user interface. Slots marked as recommended are the best fit for the schedule."
    },
    uiType: 'time_picker',
    availabilitySlots: scoredSlots,
    availabilityDate: date,
  };
}
