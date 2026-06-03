import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import stripe from '@/lib/stripe';

export async function POST(req: Request) {
 const body = await req.text();
 const signature = req.headers.get('stripe-signature');

 if (!signature) {
 return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
 }

 const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

 if (!webhookSecret) {
 logger.error('STRIPE_WEBHOOK_SECRET is not set');
 return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
 }

 let event: Stripe.Event;

 try {
 event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
 } catch (err: any) {
 logger.error(`Webhook signature verification failed: ${err.message}`);
 return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
 }

 // --- Idempotency Check ---
 try {
 const existingWebhook = await prisma.processedWebhook.findUnique({
 where: { eventId: event.id }
 });
 if (existingWebhook) {
 logger.info(`Webhook event ${event.id} already processed. Skipping.`);
 return NextResponse.json({ received: true });
 }
 } catch (err: any) {
 logger.error(`Failed to check idempotency for event ${event.id}: ${err.message}`);
 // If DB is down, fail fast so Stripe retries later
 return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
 }

 try {
 switch (event.type) {
 case 'checkout.session.completed': {
 const session = event.data.object as any;
 const meta = session.metadata || {};

 if (meta.type === 'booth_renter_booking') {
 const { renterId, shopId, serviceId, slotStart, slotEnd, clientName, clientEmail, clientPhone } = meta;

 // Find or create the client user record
 let clientUser = await prisma.user.findFirst({ where: { email: clientEmail } });
 if (!clientUser) {
 clientUser = await prisma.user.create({
 data: {
 email: clientEmail,
 name: clientName,
 role: 'CLIENT',
 shopId,
 marketingConsent: false,
 },
 });
 }

 // Create the appointment
 await prisma.appointment.create({
 data: {
 shopId,
 staffId: renterId,
 userId: clientUser.id,
 serviceId: serviceId || null,
 startTime: new Date(slotStart),
 endTime: new Date(slotEnd),
 status: 'SCHEDULED',
 notes: `Booked via QR. Paid via Stripe (${session.id})`,
 paymentId: session.payment_intent || session.id,
 totalAmount: (session.amount_total || 0) / 100,
 subtotal: (session.amount_total || 0) / 100,
 paymentMethod: 'CARD',
 },
 });

 logger.info(`Booth renter booking created for renter ${renterId}, client ${clientEmail}`);
 }
 break;
 }

 case 'payment_intent.succeeded': {
 const intent = event.data.object as Stripe.PaymentIntent;
 const type = intent.metadata?.type;

 if (type === 'no_show_deposit') {
 // Deposit was successfully authorized/captured.
 const shopId = intent.metadata?.shopId;
 const userId = intent.metadata?.userId;
 logger.info(`Deposit PaymentIntent ${intent.id} succeeded for user ${userId} at shop ${shopId}`);
 
 // NOTE: The actual appointment might not be created until after this intent is authorized on the frontend.
 // If the appointment exists and is linked, we could update it. 
 // For now, we update any appointment that happens to have this depositPaymentIntentId.
 await prisma.appointment.updateMany({
 where: { depositPaymentIntentId: intent.id },
 data: { status: 'ACCEPTED' } // Auto-accept if paid? Or leave as SCHEDULED, up to business logic.
 });
 }
 
 break;
 }

 case 'payment_intent.payment_failed': {
 const intent = event.data.object as Stripe.PaymentIntent;
 logger.warn(`PaymentIntent ${intent.id} failed. Reason: ${intent.last_payment_error?.message}`);
 
 // Find if this was an actual appointment checkout payment
 const payment = await prisma.payment.findFirst({
 where: { transactionId: intent.id }
 });

 if (payment) {
 await prisma.payment.update({
 where: { id: payment.id },
 data: { status: 'FAILED' }
 });
 logger.info(`Marked Payment ${payment.id} as FAILED`);
 }
 break;
 }

 case 'charge.dispute.created': {
 const dispute = event.data.object as Stripe.Dispute;
 const paymentIntentId = dispute.payment_intent as string;
 logger.warn(`Dispute created for PaymentIntent ${paymentIntentId}. Amount: ${dispute.amount}`);

 // If the dispute maps to a payment, flag the appointment
 const payment = await prisma.payment.findFirst({
 where: { transactionId: paymentIntentId },
 include: { appointment: true }
 });

 if (payment?.appointment) {
 await prisma.appointment.update({
 where: { id: payment.appointment.id },
 data: {
 notes: payment.appointment.notes 
 ? `${payment.appointment.notes}\n\n⚠️ DISPUTE FILED ON STRIPE: ${dispute.id}`
 : `⚠️ DISPUTE FILED ON STRIPE: ${dispute.id}`
 }
 });
 }
 break;
 }

 case 'setup_intent.succeeded': {
 const setupIntent = event.data.object as Stripe.SetupIntent;
 const customerId = setupIntent.customer as string;
 const paymentMethodId = setupIntent.payment_method as string;

 if (customerId && paymentMethodId) {
 // Update the user's saved payment method
 await prisma.shopClient.updateMany({
 where: { stripeCustomerId: customerId },
 data: { stripePaymentMethodId: paymentMethodId }
 });
 logger.info(`Successfully saved PaymentMethod ${paymentMethodId} for Customer ${customerId}`);
 }
 break;
 }

 default:
 logger.info(`Unhandled Stripe event type: ${event.type}`);
 }

 // --- Record Processed Webhook ---
 try {
 await prisma.processedWebhook.create({
 data: {
 eventId: event.id,
 type: event.type,
 provider: "STRIPE"
 }
 });
 } catch (err: any) {
 logger.error(`Failed to record processed webhook ${event.id}: ${err.message}`);
 }

 return NextResponse.json({ received: true });
 } catch (error: any) {
 logger.error(`Error processing Stripe webhook: ${error.message}`);
 return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
 }
}
