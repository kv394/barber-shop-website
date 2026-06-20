import { NextResponse } from 'next/server';
import { requireSiteAdmin } from '@/lib/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function GET() {
  try {
    const adminCheck = await requireSiteAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
