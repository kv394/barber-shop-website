import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = authUser.id;
    const authUserEmail = authUser.email;

    const dbUser = await prisma.user.findFirst({
      where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'SITE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer', 'data.plan.product'],
    });

    const formattedSubscriptions = subscriptions.data.map(sub => {
      const customer = sub.customer as Stripe.Customer;
      const product = (sub as any).plan?.product as Stripe.Product;
      
      const shopName = customer?.metadata?.shopName || customer?.name || customer?.email || 'Unknown Shop';
      const tier = product?.name || 'Unknown Tier';
      const amount = ((sub as any).plan?.amount || 0) / 100;
      
      return {
        id: sub.id,
        shopName,
        tier,
        amount,
        status: sub.status,
        date: new Date(sub.created * 1000).toISOString()
      };
    });

    return NextResponse.json({ subscriptions: formattedSubscriptions });

  } catch (error: any) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
