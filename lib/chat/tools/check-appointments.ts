import type { ToolHandlerContext, ToolHandlerResult } from '../types';

/**
 * Handles the check_appointments tool call.
 * Looks up a user by name/email and returns their upcoming appointments.
 */
export async function handleCheckAppointments(
  args: { clientName?: string; clientPhone?: string; clientEmail?: string },
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const { clientName, clientEmail } = args;
  const { prisma, realShopId } = ctx;

  if (!clientName && !clientEmail) {
    return { result: { error: "Please provide either a name or an email address." } };
  }

  const userConditions: any[] = [];
  if (clientName) userConditions.push({ name: { contains: clientName, mode: 'insensitive' } });
  if (clientEmail) userConditions.push({ email: clientEmail });

  const users = await prisma.user.findMany({
    where: { shopId: realShopId, OR: userConditions.length > 0 ? userConditions : undefined },
    select: { id: true, name: true, email: true }
  });

  if (users.length === 0) {
    return { result: { message: "No user found with that contact information." } };
  }

  const user = users[0];
  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: realShopId,
      userId: user.id,
      startTime: { gte: new Date() },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] }
    },
    include: {
      service: { select: { name: true } },
      staff: { select: { name: true } }
    },
    orderBy: { startTime: 'asc' },
    take: 5
  });

  return {
    result: {
      userDetails: {
        name: user.name,
        email: user.email
      },
      appointments: appointments.length > 0 ? appointments.map((apt: any) => ({
        id: apt.id,
        service: apt.service?.name,
        staff: apt.staff?.name,
        date: apt.startTime.toISOString().split('T')[0],
        time: apt.startTime.toISOString().split('T')[1].substring(0, 5)
      })) : "No upcoming appointments."
    }
  };
}
