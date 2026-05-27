import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string; tierId: string }> }
) {
 try {
 const { shopId, tierId } = await params;
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return new Response("Forbidden", { status: 403 });
 }

 await prisma.membershipTier.delete({
 where: { id: tierId }
 });

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 logger.error("Error deleting membership tier:", error);
 return NextResponse.json({ error: 'Failed to delete membership tier' }, { status: 500 });
 }
}
