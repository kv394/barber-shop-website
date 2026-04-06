import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/shops/[shopId]/appointments/[appointmentId]/refund
 * Process a full or partial refund for a completed appointment.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string; appointmentId: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { shopId, appointmentId } = await params;
    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canManage = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);

    if (!canManage) {
      return NextResponse.json({ error: 'Only shop admins can process refunds' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const rawRefundAmount = body.amount ? parseFloat(body.amount) : null;

    // SECURITY: Validate refund amount
    if (rawRefundAmount !== null && (isNaN(rawRefundAmount) || rawRefundAmount <= 0)) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    // SECURITY: All status/refund checks INSIDE the transaction to prevent double-refund race
    const result = await prisma.$transaction(async (tx) => {
      const freshAppointment = await tx.appointment.findUnique({
        where: { id: appointmentId, shopId },
        include: { payments: true },
      });

      if (!freshAppointment) {
        throw new Error('NOT_FOUND');
      }
      if (freshAppointment.status !== 'COMPLETED') {
        throw new Error('NOT_COMPLETED');
      }
      if (freshAppointment.refundedAt) {
        throw new Error('ALREADY_REFUNDED');
      }

      const refundAmount = rawRefundAmount ?? freshAppointment.totalAmount;

      // Validate refund doesn't exceed total
      if (refundAmount > freshAppointment.totalAmount) {
        throw new Error('EXCEEDS_TOTAL');
      }

      // Try Stripe refund for real payments
      const stripePayment = freshAppointment.payments.find(p =>
        p.transactionId && !p.transactionId.startsWith('sim_') && p.status === 'COMPLETED'
      );

      if (stripePayment?.transactionId) {
        try {
          const { refundStripePayment } = await import('@/lib/stripe');
          await refundStripePayment(stripePayment.transactionId, refundAmount);
        } catch (stripeErr) {
          logger.error('Stripe refund failed:', stripeErr);
          // Continue with manual refund record
        }
      }

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          refundAmount,
          refundedAt: new Date(),
        },
      });

      // Mark associated payments as refunded
      if (freshAppointment.payments.length > 0) {
        await tx.payment.updateMany({
          where: { appointmentId },
          data: { status: 'REFUNDED' },
        });
      }

      return { refundAmount, method: stripePayment ? 'stripe' : 'manual' };
    });

    revalidatePath(`/shop/${shopId}/bookings`);

    return NextResponse.json({
      success: true,
      refundAmount: result.refundAmount,
      method: result.method,
    });
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    if (error?.message === 'NOT_COMPLETED') {
      return NextResponse.json({ error: 'Only completed appointments can be refunded' }, { status: 400 });
    }
    if (error?.message === 'ALREADY_REFUNDED') {
      return NextResponse.json({ error: 'This appointment has already been refunded' }, { status: 400 });
    }
    if (error?.message === 'EXCEEDS_TOTAL') {
      return NextResponse.json({ error: 'Refund amount exceeds the total' }, { status: 400 });
    }
    logger.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}

