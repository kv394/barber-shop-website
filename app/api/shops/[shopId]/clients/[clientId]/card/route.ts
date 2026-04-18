import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createSetupIntent } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string, clientId: string }> }
) {
  try {
    const { shopId, clientId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    
    if (!authUserSession?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findFirst({ 
      where: { OR: [{ id: authUserSession.id }, { email: authUserSession.email || '' }] } 
    });
    
    const canManage = user?.role === 'SITE_ADMIN' || 
                     (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
                     (user?.role === 'STAFF' && user?.shopId === shopId) ||
                     (user?.id === clientId);

    if (!canManage) {
      return new Response('Forbidden', { status: 403 });
    }

    const clientUser = await prisma.user.findUnique({
      where: { id: clientId }
    });

    if (!clientUser) return new Response('Client not found', { status: 404 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil' as any,
    });

    let customerId = clientUser.stripeCustomerId;

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: clientUser.email,
        name: clientUser.name || 'Client',
        metadata: {
          userId: clientUser.id,
          shopId: shopId
        }
      });
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: clientUser.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // Call Stripe to create a SetupIntent
    const intent = await createSetupIntent(customerId, { userId: clientUser.id, shopId });
    
    return NextResponse.json(intent);
  } catch (error) {
    logger.error('Failed to create setup intent', error);
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 });
  }
}
