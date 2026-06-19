import type { ToolHandlerContext, ToolHandlerResult } from '../types';

/**
 * Handles the cancel_appointment tool call.
 * Finds the appointment and sets its status to CANCELLED.
 */
export async function handleCancelAppointment(
  args: { appointmentId: string },
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { appointmentId } = args;
  const { prisma, realShopId } = ctx;

  if (!appointmentId) {
    return { result: { error: "Missing appointmentId." } };
  }

  const cancelTarget = await prisma.appointment.findFirst({ where: { id: appointmentId, shopId: realShopId } });
  if (!cancelTarget) {
    return { result: { error: "Appointment not found." } };
  }

  await prisma.appointment.update({
    where: { id: cancelTarget.id },
    data: { status: 'CANCELLED' }
  });

  return { result: { success: true, message: "Appointment cancelled." } };
}
