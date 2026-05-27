import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LoyaltyService } from '@/lib/loyalty';
import { logger } from '@/lib/logger';

// POST - Redeem loyalty points for a discount
export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

 // Staff can redeem on behalf of a client
 const body = await request.json();
 const targetUserId = body.clientId || userId;

 // If redeeming for another user, must be staff/admin of THIS shop
 if (targetUserId !== userId) {
 if (!['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF'].includes(user.role)) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 // Tenant isolation: non-SITE_ADMIN must belong to this shop
 if (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 }

 const result = await LoyaltyService.redeemPoints(targetUserId, shopId);
 return NextResponse.json(result);
 } catch (error: any) {
 logger.error('Error redeeming points:', error);
 return NextResponse.json({ error: 'Failed to redeem points' }, { status: 400 });
 }
}

