import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBoothRenterCheckoutSession } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST — creates a Stripe Checkout Session for a booth renter booking
// Fully public — no auth required (client is booking)
export async function POST(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const body = await request.json();
 const { serviceId, date, time, clientName, clientEmail, clientPhone } = body;

 if (!serviceId || !date || !time || !clientName || !clientEmail) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 // Load the renter
 const renter = await prisma.user.findUnique({
 where: { id: renterId },
 select: {
 id: true, name: true, shopId: true,
 stripeConnectAccountId: true, stripeConnectOnboarded: true,
 shop: { select: { currency: true } },
 },
 });

 if (!renter) return NextResponse.json({ error: 'Renter not found' }, { status: 404 });
 if (!renter.stripeConnectOnboarded || !renter.stripeConnectAccountId) {
 return NextResponse.json({ error: 'Renter payment not set up' }, { status: 400 });
 }

 // Load the service
 const service = await prisma.renterService.findUnique({
 where: { id: serviceId, userId: renterId, isActive: true },
 });
 if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

 // Compute slot times
 const [h, m] = time.split(':').map(Number);
 const slotStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
 const slotEnd = new Date(slotStart.getTime() + service.duration * 60 * 1000);

 // Quick conflict check
 const conflict = await prisma.appointment.findFirst({
 where: {
 staffId: renterId,
 status: { not: 'CANCELLED' },
 startTime: { lt: slotEnd },
 endTime: { gt: slotStart },
 },
 });
 if (conflict) {
 return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
 }

 const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
 const currency = renter.shop?.currency || 'USD';

 const { url } = await createBoothRenterCheckoutSession({
 renterStripeAccountId: renter.stripeConnectAccountId,
 serviceId: service.id,
 serviceName: `${service.name} with ${renter.name || 'Stylist'}`,
 amount: service.price,
 currency,
 renterId,
 shopId: renter.shopId!,
 slotStart: slotStart.toISOString(),
 slotEnd: slotEnd.toISOString(),
 clientName,
 clientEmail,
 clientPhone: clientPhone || '',
 successUrl: `${appUrl}/book/${renterId}/success?session_id={CHECKOUT_SESSION_ID}`,
 cancelUrl: `${appUrl}/book/${renterId}`,
 });

 return NextResponse.json({ url });
 } catch (error: any) {
 logger.error('Error creating booth renter checkout:', error);
 return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
 }
}
