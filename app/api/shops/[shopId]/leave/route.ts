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
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const filterUserId = searchParams.get('userId') || user.id;

 // Only SHOP_ADMIN/SITE_ADMIN can see other people's leaves
 if (filterUserId !== user.id && user.role !== 'SHOP_ADMIN') {
 return new Response('Forbidden', { status: 403 });
 }

 const leaves = await tenantClient.leave.findMany({
 where: { shopId, userId: filterUserId },
 orderBy: { date: 'desc' }
 });

 return NextResponse.json(leaves);
 } catch (error: any) {
 logger.error("Error fetching leaves:", error);
 return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
 }
}

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
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 const body = await request.json();
 
 const targetUserId = body.userId || user.id;
 if (targetUserId !== user.id && user.role !== 'SHOP_ADMIN') {
 return new Response('Forbidden', { status: 403 });
 }

 if (!body.date || !body.startTime || !body.endTime) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 const date = new Date(body.date);
 const startTime = new Date(body.startTime);
 const endTime = new Date(body.endTime);

 const leave = await tenantClient.leave.create({
 data: {
 shopId,
 userId: targetUserId,
 date,
 startTime,
 endTime,
 reason: body.reason || null,
 },
 });

 return NextResponse.json(leave);
 } catch (error: any) {
 logger.error("Error creating leave:", error);
 return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 });
 }
}
