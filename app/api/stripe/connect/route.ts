import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
    const userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ 
      where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } 
    });

    if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId, role: 'SHOP_ADMIN' } })))))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    let accountId = shop.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        business_type: 'company'
      });
      accountId = account.id;

      await prisma.shop.update({
        where: { id: shopId },
        data: { stripeConnectAccountId: accountId }
      });
    }

    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/shop/${shopId}/settings?tab=general&refresh=true`,
      return_url: `${baseUrl}/shop/${shopId}/settings?tab=general&stripe_connected=true`,
      type: 'account_onboarding',
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error: any) {
    console.error('Stripe connect error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
