import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['ATTENDANCE_KIOSK', 'SHOP_ADMIN', 'SITE_ADMIN']);
 if (authResult instanceof NextResponse) return authResult;

 const body = await request.json();
 const { clientName, clientPhone, serviceId } = body;

 if (!clientName) {
 return NextResponse.json({ error: 'Name is required' }, { status: 400 });
 }

 // Atomic position calculation + create to prevent duplicate positions
 const entry = await tenantClient.$transaction(async (tx: any) => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const lastEntry = await tx.waitlist.findFirst({
 where: { shopId: shopId, createdAt: { gte: today } },
 orderBy: { position: 'desc' },
 });

 return tx.waitlist.create({
 data: {
 clientName: String(clientName).slice(0, 200),
 clientPhone: clientPhone ? String(clientPhone).slice(0, 30) : null,
 partySize: 1,
 serviceId: serviceId || null,
 position: (lastEntry?.position || 0) + 1,
 shopId: shopId,
 },
 });
 }, { isolationLevel: 'Serializable' });

 revalidatePath(`/shop/${shopId}/waitlist`);
 
 // (Optional) We could send an SMS to the client here via NotificationService
 // saying "You've been added to the waitlist!"
 
 return NextResponse.json(entry, { status: 201 });
 } catch (error) {
 logger.error('Error adding walk-in to waitlist from kiosk:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
