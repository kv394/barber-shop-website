import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

import { resolveShopId } from '@/lib/shop-resolution';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId: paramShopId } = await params; const shopId = await resolveShopId(paramShopId);
 if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

 const addons = await tenantClient.serviceAddon.findMany({
 where: { shopId },
 orderBy: { name: 'asc' },
 include: {
 services: { select: { id: true, name: true } }
 }
 });

 return NextResponse.json(addons);
 } catch (error) {
 console.error('Error fetching addons:', error);
 return NextResponse.json({ error: 'Failed to fetch addons' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const addon = await tenantClient.serviceAddon.create({
 data: {
 shopId,
 name: body.name,
 price: Number(body.price),
 durationMin: Number(body.durationMin) || 0,
 }
 });

 return NextResponse.json(addon);
 } catch (error) {
 console.error('Error creating addon:', error);
 return NextResponse.json({ error: 'Failed to create addon' }, { status: 500 });
 }
}
