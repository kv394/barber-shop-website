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
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 // Verify the requesting user is staff/admin of this shop
 const requestingUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!requestingUser || !['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF'].includes(requestingUser.role)) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
 }
 if (requestingUser.role !== 'SITE_ADMIN' && (requestingUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: requestingUser.id, shopId } })))) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const query = searchParams.get('q')?.trim();

 if (!query || query.length < 2) {
 return NextResponse.json([]);
 }

 // Search clients by name or email (case-insensitive)
 const clients = await tenantClient.user.findMany({
 where: {
 shopId: shopId,
 role: 'CLIENT',
 OR: [
 { name: { contains: query, mode: 'insensitive' } },
 { email: { contains: query, mode: 'insensitive' } },
 ],
 },
 select: {
 id: true,
 name: true,
 email: true,
 },
 take: 10,
 orderBy: { name: 'asc' },
 });

 return NextResponse.json(clients);
 } catch (error) {
 return NextResponse.json({ error: 'Failed to search clients' }, { status: 500 });
 }
}

