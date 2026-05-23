import { getTenantClient } from '@/lib/prisma';

/** Create a new booking */
export async function createBooking(args: { serviceId: string; staffId: string; startTime: string; clientId: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const booking = await db.booking.create({
    data: {
      serviceId: args.serviceId,
      staffId: args.staffId,
      startTime: new Date(args.startTime),
      clientId: args.clientId,
    },
  });
  return booking;
}

/** Update an existing booking */
export async function updateBooking(args: { bookingId: string; startTime?: string; staffId?: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const data: any = {};
  if (args.startTime) data.startTime = new Date(args.startTime);
  if (args.staffId) data.staffId = args.staffId;
  const booking = await db.booking.update({
    where: { id: args.bookingId },
    data,
  });
  return booking;
}

/** Cancel a booking */
export async function cancelBooking(args: { bookingId: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const booking = await db.booking.update({
    where: { id: args.bookingId },
    data: { status: 'CANCELLED' },
  });
  return booking;
}

/** List bookings (optional filter) */
export async function listBookings(args: { clientId?: string; staffId?: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const where: any = {};
  if (args.clientId) where.clientId = args.clientId;
  if (args.staffId) where.staffId = args.staffId;
  const bookings = await db.booking.findMany({ where });
  return bookings;
}
