import { toShopTzDayBounds } from '@/lib/timezone';
import type { ToolHandlerContext, ToolHandlerResult } from '../types';

/**
 * Handles the reschedule_appointment tool call.
 * Finds the appointment and updates its start/end time.
 */
export async function handleRescheduleAppointment(
  args: { appointmentId: string; date: string; time: string },
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { appointmentId, date, time } = args;
  const { prisma, shop, realShopId } = ctx;

  if (!appointmentId || !date || !time) {
    return { result: { error: "Missing required arguments." } };
  }

  const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, shopId: realShopId } });
  if (!apt) {
    return { result: { error: "Appointment not found." } };
  }

  const shopTz = shop.timezone || 'America/New_York';
  const { startOfDay } = toShopTzDayBounds(date, shopTz);
  const [h, m] = time.split(':');
  const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);
  const service = await prisma.service.findUnique({ where: { id: apt.serviceId || undefined } });
  const endTime = new Date(startTime.getTime() + (service?.duration || 30) * 60000);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { startTime, endTime }
  });

  return { result: { success: true, message: "Appointment rescheduled." } };
}
