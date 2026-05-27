import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { cacheService } from '@/lib/cache';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

 const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { customization: true } });
 const c = (shop?.customization as any) || {};
 const defaultHours = {
 monday: { open: '09:00', close: '18:00' },
 tuesday: { open: '09:00', close: '18:00' },
 wednesday: { open: '09:00', close: '18:00' },
 thursday: { open: '09:00', close: '18:00' },
 friday: { open: '09:00', close: '18:00' },
 saturday: { open: '09:00', close: '15:00' },
 sunday: null,
 };
 return NextResponse.json(c.businessHours ?? defaultHours);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await req.json();

 // SECURITY: Validate business hours shape — only known days with {open, close} or null
 const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
 const timePattern = /^\d{2}:\d{2}$/;
 const businessHours: Record<string, any> = {};
 for (const day of validDays) {
 if (body[day] === null || body[day] === undefined) {
 businessHours[day] = null;
 } else if (
 typeof body[day] === 'object' &&
 typeof body[day].open === 'string' && timePattern.test(body[day].open) &&
 typeof body[day].close === 'string' && timePattern.test(body[day].close)
 ) {
 businessHours[day] = { open: body[day].open, close: body[day].close };
 } else {
 return NextResponse.json({ error: `Invalid hours for ${day}` }, { status: 400 });
 }
 }

 const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { customization: true, name: true } });
 const c = (shop?.customization as any) || {};
 await prisma.shop.update({
 where: { id: shopId },
 data: { customization: { ...c, businessHours } },
 });

 // Clear public cache so business hours show up immediately
 await cacheService.invalidate(`shop_public_page_data:${shopId}`);
 if (shop?.name) {
 const slug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
 await cacheService.invalidate(`shop_public_page_data:${slug}`);
 }

 return NextResponse.json({ ok: true });
}

