import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string, appointmentId: string }> }
) {
 try {
 const { shopId, appointmentId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 // Check if Shop Admin, Staff, or Site Admin
 const canManage = (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
 (user?.role === 'STAFF' && user?.shopId === shopId);

 // Also check if the user is a CLIENT trying to cancel their OWN appointment
 let isClientCancelingOwn = false;
 if (user?.role === 'CLIENT') {
 const appointmentToCancel = await tenantClient.appointment.findUnique({
 where: { id: appointmentId }
 });
 if (appointmentToCancel && appointmentToCancel.userId === userId) {
 isClientCancelingOwn = true;
 }
 }

 if (!canManage && !isClientCancelingOwn) {
 return new Response('Forbidden: You do not have permission to cancel this appointment.', { status: 403 });
 }

 // Verify appointment exists and belongs to the specified shop to prevent cross-shop deletion attacks
 const appointment = await tenantClient.appointment.findUnique({
 where: { id: appointmentId }
 });

 if (!appointment || (appointment.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: appointment.id, shopId } })))) {
 return NextResponse.json({ error: 'Appointment not found or does not belong to this shop.' }, { status: 404 });
 }

 await tenantClient.appointment.delete({
 where: { 
 id: appointmentId,
 shopId: shopId
 }
 });

 revalidatePath(`/shop/${shopId}/bookings`);

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 logger.error("Error deleting appointment:", error);
 return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
 }
}

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string, appointmentId: string }> }
) {
 try {
 const { shopId, appointmentId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canManage = (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
 (user?.role === 'STAFF' && user?.shopId === shopId);

 if (!canManage) {
 return new Response('Forbidden', { status: 403 });
 }

 const body = await request.json();
 const updateData: any = {};

  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.status && ['SCHEDULED', 'ACCEPTED', 'WORK_COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(body.status)) {
    // Enforce valid state transitions
    const currentAppt = await tenantClient.appointment.findUnique({ where: { id: appointmentId, shopId }, select: { status: true } });
    if (!currentAppt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    const validTransitions: Record<string, string[]> = {
      SCHEDULED: ['ACCEPTED', 'CANCELLED', 'NO_SHOW'],
      ACCEPTED: ['WORK_COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      WORK_COMPLETED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],          // Terminal state
      CANCELLED: [],          // Terminal state
      NO_SHOW: [],            // Terminal state
    };
    const allowed = validTransitions[currentAppt.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentAppt.status} to ${body.status}` },
        { status: 400 }
      );
    }
    updateData.status = body.status;
  }

 // Fetch current appointment for deposit handling
  const currentAppointment = await tenantClient.appointment.findUnique({
  where: { id: appointmentId, shopId },
  select: {
    id: true,
    shopId: true,
    depositPaymentIntentId: true,
    service: { select: { price: true } },
    shop: { select: { stripeAccountId: true, paymentGateway: true } },
    user: {
      select: {
        shopClients: {
          where: { shopId },
          select: {
            stripeCustomerId: true,
            stripePaymentMethodId: true
          }
        }
      }
    }
  }
  });

 if (!currentAppointment) {
 return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
 }

 // C5: Handle deposit capture/release on status change (only for Stripe shops)
 if (updateData.status && currentAppointment.shop.paymentGateway === 'STRIPE') {
 try {
 if (updateData.status === 'NO_SHOW') {
 if (currentAppointment.depositPaymentIntentId) {
 const { captureDeposit } = await import('@/lib/stripe');
 await captureDeposit(currentAppointment.depositPaymentIntentId, currentAppointment.shop.stripeAccountId);
 } else if (currentAppointment.user?.shopClients[0]?.stripeCustomerId && currentAppointment.user?.shopClients[0]?.stripePaymentMethodId && currentAppointment.service) {
 // Charge 50% cancellation fee
 const { chargeNoShowFee } = await import('@/lib/stripe');
 const feeAmount = currentAppointment.service.price * 0.50;
 if (feeAmount > 0) {
 await chargeNoShowFee(
 currentAppointment.user.shopClients[0].stripeCustomerId,
 currentAppointment.user.shopClients[0].stripePaymentMethodId,
 feeAmount,
 { appointmentId: currentAppointment.id, shopId: currentAppointment.shopId },
 currentAppointment.shop.stripeAccountId
 );
 }
 }
 } else if (updateData.status === 'CANCELLED' && currentAppointment.depositPaymentIntentId) {
 const { releaseDeposit } = await import('@/lib/stripe');
 await releaseDeposit(currentAppointment.depositPaymentIntentId, currentAppointment.shop.stripeAccountId);
 }
 } catch (stripeErr) {
 logger.error('Deposit capture/release or no-show fee failed (non-critical):', stripeErr);
 }
 }

 const appointment = await tenantClient.appointment.update({
 where: { id: appointmentId, shopId: shopId },
 data: updateData,
 });

 revalidatePath(`/shop/${shopId}/bookings`);
 return NextResponse.json(appointment);
 } catch (error: any) {
 logger.error("Error updating appointment:", error);
 return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
 }
}
