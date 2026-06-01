import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { createTerminalConnectionToken } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 
 if (!authUserSession?.id) {
 return new Response('Unauthorized', { status: 401 });
 }

 const user = await tenantClient.user.findFirst({ 
 where: { OR: [{ id: authUserSession.id }, { email: authUserSession.email || '' }] } 
 });
 
 const canManage = (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
 (user?.role === 'STAFF' && user?.shopId === shopId);

 if (!canManage) {
 return new Response('Forbidden', { status: 403 });
 }

 // Fetch shop's payment config
 const shop = await tenantClient.shop.findUnique({
 where: { id: shopId },
 select: { stripeAccountId: true, paymentGateway: true },
 });

 if (!shop || shop.paymentGateway !== 'STRIPE') {
 return NextResponse.json({ error: 'Stripe is not configured for this shop' }, { status: 400 });
 }

 // Call Stripe to create a terminal connection token using the shop's own account
 const token = await createTerminalConnectionToken(shop.stripeAccountId);
 
 return NextResponse.json({ secret: token });
 } catch (error) {
 logger.error('Failed to create terminal connection token', error);
 return NextResponse.json({ error: 'Failed to create connection token' }, { status: 500 });
 }
}
