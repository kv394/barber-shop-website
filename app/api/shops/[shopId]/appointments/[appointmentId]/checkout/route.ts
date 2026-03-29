import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: { shopId: string, appointmentId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Only Shop Admin, Staff, or Super Admin can mark an appointment as paid
    const canManage = user?.role === 'SUPER_ADMIN' || 
                     (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId) ||
                     (user?.role === 'STAFF' && user?.shopId === params.shopId);

    if (!canManage) {
        return new Response('Forbidden: Only staff can process payments.', { status: 403 });
    }

    // Verify appointment exists and belongs to the specified shop
    const appointment = await prisma.appointment.findUnique({
        where: { id: params.appointmentId }
    });

    if (!appointment || appointment.shopId !== params.shopId) {
        return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    if (appointment.status === 'COMPLETED') {
         return NextResponse.json({ error: 'This appointment has already been checked out.' }, { status: 400 });
    }

    // Parse optional checkout fields
    let tipAmount = 0, discount = 0, paymentMethod = 'CASH';
    let cartItems: any[] = [];
    let payments: any[] = [];

    try {
      const body = await request.json();
      tipAmount = parseFloat(body.tipAmount) || 0;
      discount = parseFloat(body.discount) || 0;
      paymentMethod = body.paymentMethod || 'CASH';
      cartItems = body.cartItems || [];
      payments = body.payments || [];
    } catch {}

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Rough tax placeholder logic: sum of (price * quantity * taxRate)
    const taxAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * (item.taxRate || 0)), 0);
    const totalAmount = subtotal + taxAmount - discount + tipAmount;

    // Build the transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark appointment as completed
      await tx.appointment.update({
          where: { id: params.appointmentId },
          data: { 
              status: 'COMPLETED',
              tipAmount,
              discount,
              paymentMethod, // legacy field
              subtotal,
              taxAmount,
              totalAmount,
              paymentId: `sim_${paymentMethod.toLowerCase()}_${Date.now()}` 
          }
      });

      // 2. Create Appointment Items
      if (cartItems.length > 0) {
        await tx.appointmentItem.createMany({
          data: cartItems.map(item => ({
            appointmentId: params.appointmentId,
            productId: item.productId,
            serviceId: item.serviceId,
            name: item.name || 'Item',
            quantity: item.quantity,
            price: item.price,
            cost: item.cost || 0,
            taxRate: item.taxRate || 0,
          }))
        });

        // 3. Deduct Inventory for Products
        for (const item of cartItems) {
          if (item.productId && item.trackInventory) {
             await tx.product.update({
               where: { id: item.productId },
               data: { inventoryCount: { decrement: item.quantity } }
             });
          }
        }
      }

      // 4. Record separate Payment splits if provided
      if (payments.length > 0) {
         await tx.payment.createMany({
           data: payments.map(p => ({
             appointmentId: params.appointmentId,
             method: p.method,
             amount: p.amount,
             status: 'COMPLETED',
             stripeId: p.stripeId || null,
           }))
         });
      }
    });

    revalidatePath(`/shop/${params.shopId}/bookings`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error("Error checking out appointment:", error);
    return NextResponse.json({ error: error.message || 'Failed to checkout' }, { status: 500 });
  }
}
