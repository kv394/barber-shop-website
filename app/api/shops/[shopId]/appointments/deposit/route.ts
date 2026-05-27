import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createDepositPaymentIntent } from '@/lib/stripe';

/**
 * POST /api/shops/[shopId]/appointments/deposit
 * Create a Stripe PaymentIntent for a no-show deposit.
 * Returns clientSecret for Stripe Elements on the frontend.
 */
export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 try {
 const { shopId } = await params;
 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { depositRequired: true, depositAmount: true, name: true, stripeAccountId: true, paymentGateway: true },
 });

 if (!shop || !shop.depositRequired || shop.depositAmount <= 0) {
 return NextResponse.json({ error: 'Deposits not required for this shop' }, { status: 400 });
 }

 if (shop.paymentGateway !== 'STRIPE') {
 return NextResponse.json({ error: 'Online deposits are only supported with Stripe. This shop uses ' + shop.paymentGateway + '.' }, { status: 400 });
 }

 const { clientSecret, paymentIntentId } = await createDepositPaymentIntent(
 shop.depositAmount,
 { shopId, userId, shopName: shop.name, type: 'no_show_deposit' },
 shop.stripeAccountId
 );

 return NextResponse.json({ clientSecret, paymentIntentId, amount: shop.depositAmount });
 } catch (error: any) {
 return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 });
 }
}

