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

 if (!userId) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const currentUser = await tenantClient.user.findUnique({
 where: { id: userId },
 });

 if (!currentUser || 
 ((currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))) &&
 (currentUser.role !== 'STAFF' || (currentUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 // Get all clients associated with this shop directly OR who have made an appointment here
  const clients = await tenantClient.user.findMany({
  where: {
  role: 'CLIENT',
  OR: [
  { shopId: shopId },
  { clientAppointments: { some: { shopId: shopId } } }
  ]
  },
  select: {
  id: true,
  name: true,
  email: true,
  imageUrl: true,
  role: true,
  createdAt: true,
  barcode: true,
  _count: {
  select: {
  clientAppointments: {
  where: { shopId: shopId }
  }
  }
  }
  },
  orderBy: { createdAt: 'desc' },
  distinct: ['id']
  });

 return NextResponse.json(clients, { status: 200 });
 } catch (error) {
 logger.error('Error fetching clients:', error);
 return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
 }
}
