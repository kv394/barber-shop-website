import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Verify user has permission to view logs for this shop
 const currentUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!currentUser || (currentUser.role !== 'SITE_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 // Get all time logs for the current day for the given shop
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);

 const logs = await tenantClient.timeLog.findMany({
 where: {
 shopId: shopId,
 clockIn: {
 gte: today,
 lt: tomorrow,
 },
 },
 include: {
 user: {
 select: {
 name: true,
 email: true,
 }
 }
 },
 orderBy: {
 clockIn: 'desc'
 }
 });

 return NextResponse.json(logs);

 } catch (error: any) {
 logger.error('Error fetching attendance logs:', error);
 return NextResponse.json({ error: 'Failed to fetch attendance logs' }, { status: 500 });
 }
}
