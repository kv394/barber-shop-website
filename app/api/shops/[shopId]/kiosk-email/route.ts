import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
import crypto from 'crypto';

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const { email } = await request.json();
 if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
 return NextResponse.json({ error: 'Valid Kiosk Email is required' }, { status: 400 });
 }

 const sanitizedEmail = email.trim().toLowerCase();

 // Check if another user already uses this email (other than the kiosk user)
 const existing = await tenantClient.user.findUnique({ where: { email: sanitizedEmail } });
 
 const kioskUser = await tenantClient.user.findFirst({
 where: { shopId, role: 'ATTENDANCE_KIOSK' }
 });

 if (existing && existing.id !== kioskUser?.id) {
 return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 400 });
 }

 if (kioskUser) {
 await tenantClient.user.update({
 where: { id: kioskUser.id },
 data: { email: sanitizedEmail }
 });
 } else {
 // If there was no kiosk user, create one
 const kioskBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();
 await tenantClient.user.create({
 data: {
 id: `kiosk_init_${shopId}_${crypto.randomBytes(4).toString('hex')}`,
 email: sanitizedEmail,
 name: `Kiosk User`,
 role: 'ATTENDANCE_KIOSK',
 shopId: shopId,
 barcode: kioskBarcode
 }
 });
 }

 return NextResponse.json({ success: true, email: sanitizedEmail });
 } catch (error) {
 console.error('Error updating kiosk email:', error);
 return NextResponse.json({ error: 'Failed to update kiosk email' }, { status: 500 });
 }
}
