import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string, leaveId: string }> }
) {
 try {
 const { shopId, leaveId } = await params;
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 const leave = await prisma.leave.findUnique({
 where: { id: leaveId }
 });

 if (!leave || (leave.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: leave.id, shopId } })))) {
 return new Response('Not Found', { status: 404 });
 }

 // Only allow deletion if the user is the owner of the leave OR is a SHOP_ADMIN/SITE_ADMIN
 if (leave.userId !== user.id && user.role !== 'SHOP_ADMIN' && user.role !== 'SITE_ADMIN') {
 return new Response('Forbidden', { status: 403 });
 }

 await prisma.leave.delete({
 where: { id: leaveId }
 });

 return NextResponse.json({ success: true });
 } catch (error: any) {
 logger.error("Error deleting leave:", error);
 return NextResponse.json({ error: 'Failed to delete leave' }, { status: 500 });
 }
}
