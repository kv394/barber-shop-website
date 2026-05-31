import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { createSetupIntent } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string, clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 
 if (!authUserSession?.id) {
 return new Response('Unauthorized', { status: 401 });
 }

 const user = await tenantClient.user.findFirst({ 
 where: { OR: [{ id: authUserSession.id }, { email: authUserSession.email || '' }] } 
 });
 
 const canManage = user?.role === 'SITE_ADMIN' || 
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
 (user?.role === 'STAFF' && user?.shopId === shopId) ||
 (user?.id === clientId);

 if (!canManage) {
 return new Response('Forbidden', { status: 403 });
 }

 const clientUser = await tenantClient.user.findUnique({
 where: { id: clientId },
 include: { shopClients: { where: { shopId } } }
 });

 if (!clientUser) return new Response('Client not found', { status: 404 });

 // Fetch shop's payment config
 const shop = await tenantClient.shop.findUnique({
 where: { id: shopId },
 select: { stripeAccountId: true, paymentGateway: true },
 });

 if (!shop || shop.paymentGateway !== 'STRIPE') {
 return NextResponse.json({ error: 'Stripe is not configured for this shop' }, { status: 400 });
 }

 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
 apiVersion: '2025-03-31.basil' as any,
 });
 const stripeOptions = shop.stripeAccountId ? { stripeAccount: shop.stripeAccountId } : undefined;

 let customerId = clientUser.shopClients[0]?.stripeCustomerId;

 if (!customerId) {
 // Create a new Stripe customer on the shop's own account
 const customer = await stripe.customers.create({
 email: clientUser.email,
 name: clientUser.name || 'Client',
 metadata: {
 userId: clientUser.id,
 shopId: shopId
 }
 }, stripeOptions);
 customerId = customer.id;
 
 await tenantClient.shopClient.upsert({
 where: { userId_shopId: { userId: clientUser.id, shopId } },
 create: { userId: clientUser.id, shopId, stripeCustomerId: customerId },
 update: { stripeCustomerId: customerId }
 });
 }

 // Call Stripe to create a SetupIntent on the shop's own account
 const intent = await createSetupIntent(customerId, { userId: clientUser.id, shopId }, shop.stripeAccountId);
 
 return NextResponse.json(intent);
 } catch (error) {
 logger.error('Failed to create setup intent', error);
 return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 });
 }
}
