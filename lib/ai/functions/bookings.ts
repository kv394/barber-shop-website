import { getTenantClient } from '@/lib/prisma';

/** Create a new booking */
export async function createBooking(args: { serviceId: string; staffId: string; startTime: string; clientId: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const booking = await db.appointment.create({
    data: {
      serviceId: args.serviceId,
      staffId: args.staffId,
      startTime: new Date(args.startTime),
      endTime: new Date(new Date(args.startTime).getTime() + 30 * 60000), // Default 30 mins
      userId: args.clientId,
      shopId: shopId,
    },
  });
  return booking;
}

/** Update an existing booking */
export async function updateBooking(args: { bookingId: string; startTime?: string; staffId?: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const data: any = {};
  if (args.startTime) data.startTime = new Date(args.startTime);
  if (args.staffId) data.staffId = args.staffId;
  const booking = await db.appointment.update({
    where: { id: args.bookingId },
    data,
  });
  return booking;
}

/** Cancel a booking */
export async function cancelBooking(args: { bookingId: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const booking = await db.appointment.update({
    where: { id: args.bookingId },
    data: { status: 'CANCELLED' },
  });
  return booking;
}

/** List bookings (optional filter) */
export async function listBookings(args: { clientId?: string; staffId?: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const where: any = { shopId };
  if (args.clientId) where.userId = args.clientId;
  if (args.staffId) where.staffId = args.staffId;
  const bookings = await db.appointment.findMany({ where });
  return bookings;
}
