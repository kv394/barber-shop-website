import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { validateParams } from '@/app/lib/validation';
import { RenterAvailabilitySchema } from '@/app/lib/schemas/renterAvailability';


export const dynamic = 'force-dynamic';

// GET ?date=YYYY-MM-DD&duration=30
// Returns available time slots for a renter on a given date
export async function GET(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const { searchParams } = new URL(request.url);
 const { date, duration } = validateParams(RenterAvailabilitySchema, searchParams);

 if (!date) {
 return NextResponse.json({ error: 'date is required' }, { status: 400 });
 }

 const renter = await prisma.user.findUnique({
 where: { id: renterId },
 select: { workingHours: true, shopId: true },
 });

 if (!renter) return NextResponse.json({ error: 'Renter not found' }, { status: 404 });

 const workingHours = (renter.workingHours || {}) as Record<string, { open: string; close: string } | null>;
 const dayName = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
 const dayHours = workingHours[dayName];

 if (!dayHours) {
 return NextResponse.json({ slots: [], message: 'Not working this day' });
 }

 // Build all slots for the day
 const [openH, openM] = dayHours.open.split(':').map(Number);
 const [closeH, closeM] = dayHours.close.split(':').map(Number);
 const openMinutes = openH * 60 + openM;
 const closeMinutes = closeH * 60 + closeM;

 // Fetch already-booked appointments for this renter on this date
 const dayStart = new Date(`${date}T00:00:00.000Z`);
 const dayEnd = new Date(`${date}T23:59:59.999Z`);
 const bookedAppointments = await prisma.appointment.findMany({
 where: {
 staffId: renterId,
 startTime: { gte: dayStart, lte: dayEnd },
 status: { not: 'CANCELLED' },
 },
 select: { startTime: true, endTime: true },
 });

 const bookedRanges: { start: number; end: number }[] = bookedAppointments.map((a: { startTime: Date; endTime: Date }) => ({
 start: new Date(a.startTime).getHours() * 60 + new Date(a.startTime).getMinutes(),
 end: new Date(a.endTime).getHours() * 60 + new Date(a.endTime).getMinutes(),
 }));

 // Generate 30-minute slots
 const slotInterval = 30;
 const slots: { time: string; available: boolean }[] = [];

 for (let m = openMinutes; m + duration <= closeMinutes; m += slotInterval) {
 const slotEnd = m + duration;
 const isBooked = bookedRanges.some(r => m < r.end && slotEnd > r.start);
 const h = Math.floor(m / 60);
 const min = m % 60;
 const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
 slots.push({ time, available: !isBooked });
 }

 return NextResponse.json({ slots, dayHours }, {
  headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
 });
 } catch (error) {
 logger.error('Error fetching renter availability:', error);
 return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
 }
}
