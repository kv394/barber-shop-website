import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string, appointmentId: string }> }
) {
  try {
    const { shopId, appointmentId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    
    // Check if Shop Admin, Staff, or Super Admin
    const canManage = user?.role === 'SUPER_ADMIN' || 
                     (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
                     (user?.role === 'STAFF' && user?.shopId === shopId);

    // Also check if the user is a CLIENT trying to cancel their OWN appointment
    let isClientCancelingOwn = false;
    if (user?.role === 'CLIENT') {
        const appointmentToCancel = await prisma.appointment.findUnique({
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
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
    });

    if (!appointment || appointment.shopId !== shopId) {
        return NextResponse.json({ error: 'Appointment not found or does not belong to this shop.' }, { status: 404 });
    }

    await prisma.appointment.delete({
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
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canManage = user?.role === 'SUPER_ADMIN' ||
                     (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
                     (user?.role === 'STAFF' && user?.shopId === shopId);

    if (!canManage) {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status && ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(body.status)) {
      updateData.status = body.status;
    }

    // Fetch current appointment for deposit handling
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, shopId },
    });

    if (!currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // C5: Handle deposit capture/release on status change
    if (currentAppointment.depositPaymentIntentId && updateData.status) {
      try {
        if (updateData.status === 'NO_SHOW') {
          const { captureDeposit } = await import('@/lib/stripe');
          await captureDeposit(currentAppointment.depositPaymentIntentId);
        } else if (updateData.status === 'CANCELLED') {
          const { releaseDeposit } = await import('@/lib/stripe');
          await releaseDeposit(currentAppointment.depositPaymentIntentId);
        }
      } catch (stripeErr) {
        logger.error('Deposit capture/release failed (non-critical):', stripeErr);
      }
    }

    const appointment = await prisma.appointment.update({
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
