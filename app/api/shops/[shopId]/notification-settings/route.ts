import { NextRequest, NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const shop = await tenantClient.shop.findUnique({ where: { id: shopId }, select: { customization: true } });
 const c = (shop?.customization as any) || {};
 return NextResponse.json({
 appointmentReminders: c.notifSettings?.appointmentReminders ?? true,
 reminder24h: c.notifSettings?.reminder24h ?? true,
 reminder1h: c.notifSettings?.reminder1h ?? false,
 reviewRequests: c.notifSettings?.reviewRequests ?? true,
 reviewRequestDelayH: c.notifSettings?.reviewRequestDelayH ?? 2,
 noShowAlerts: c.notifSettings?.noShowAlerts ?? true,
 birthdayMessages: c.notifSettings?.birthdayMessages ?? true,
 loyaltyUpdates: c.notifSettings?.loyaltyUpdates ?? true,
 newBookingAlert: c.notifSettings?.newBookingAlert ?? true,
 cancellationAlert: c.notifSettings?.cancellationAlert ?? true,
 channel: c.notifSettings?.channel ?? 'EMAIL',
 adminEmail: c.notifSettings?.adminEmail ?? '',
 adminPhone: c.notifSettings?.adminPhone ?? '',
 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await req.json();

 // SECURITY: Whitelist allowed fields to prevent mass assignment
 const allowedBoolFields = [
 'appointmentReminders', 'reminder24h', 'reminder1h', 'reviewRequests',
 'noShowAlerts', 'birthdayMessages', 'loyaltyUpdates', 'newBookingAlert', 'cancellationAlert',
 ];
 const sanitized: Record<string, any> = {};
 for (const field of allowedBoolFields) {
 if (body[field] !== undefined) sanitized[field] = Boolean(body[field]);
 }
 if (body.reviewRequestDelayH !== undefined) {
 sanitized.reviewRequestDelayH = Math.max(0, Math.min(72, parseInt(body.reviewRequestDelayH) || 2));
 }
 if (body.channel !== undefined && ['EMAIL', 'SMS', 'BOTH'].includes(body.channel)) {
 sanitized.channel = body.channel;
 }
 if (body.adminEmail !== undefined) {
 sanitized.adminEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().slice(0, 200) : '';
 }
 if (body.adminPhone !== undefined) {
 sanitized.adminPhone = typeof body.adminPhone === 'string' ? body.adminPhone.trim().slice(0, 30) : '';
 }

 const shop = await tenantClient.shop.findUnique({ where: { id: shopId }, select: { customization: true } });
 const c = (shop?.customization as any) || {};
 await tenantClient.shop.update({
 where: { id: shopId },
 data: { customization: { ...c, notifSettings: { ...c.notifSettings, ...sanitized } } },
 });
 return NextResponse.json({ ok: true });
}

