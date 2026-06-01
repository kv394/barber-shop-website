import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string; resourceId: string }> }
) {
 try {
 const { shopId, resourceId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || ((user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return new Response("Forbidden", { status: 403 });
 }

 await tenantClient.resource.delete({
 where: { id: resourceId }
 });

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 logger.error("Error deleting resource:", error);
 return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
 }
}
