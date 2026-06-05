import { NextRequest, NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { validateParams } from '@/app/lib/validation';
import { BlackoutCreateSchema, BlackoutDeleteSchema } from '@/lib/schemas/blackoutDates';
import { requireShopRole, isAuthError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const dates = await tenantClient.shopBlackoutDate.findMany({
 where: { shopId },
 orderBy: { date: 'asc' },
 });
 return NextResponse.json({ dates });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

  const body = await req.json();
  const { date, reason } = BlackoutCreateSchema.parse(body);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
 const entry = await tenantClient.shopBlackoutDate.upsert({
 where: { shopId_date: { shopId, date: d } },
 update: { reason: reason || null },
 create: { shopId, date: d, reason: reason || null },
 });
 return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

  const { searchParams } = new URL(req.url);
  const { id } = BlackoutDeleteSchema.parse(Object.fromEntries(searchParams.entries()));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

 // Verify blackout date belongs to this shop (prevent cross-shop deletion)
 const entry = await tenantClient.shopBlackoutDate.findUnique({ where: { id } });
 if (!entry || (entry.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: entry.id, shopId } })))) {
 return NextResponse.json({ error: 'Not found' }, { status: 404 });
 }

 await tenantClient.shopBlackoutDate.delete({ where: { id } });
 return NextResponse.json({ ok: true });
}

