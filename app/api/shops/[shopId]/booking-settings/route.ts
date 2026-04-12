import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
export const dynamic = 'force-dynamic';

// GET + PUT booking settings stored in customization JSON
export async function GET(_: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { customization: true } });
  const c = (shop?.customization as any) || {};
  return NextResponse.json({
    onlineBookingEnabled:     c.bookingSettings?.onlineBookingEnabled     ?? true,
    minAdvanceHours:          c.bookingSettings?.minAdvanceHours          ?? 1,
    maxAdvanceDays:           c.bookingSettings?.maxAdvanceDays           ?? 60,
    cancellationWindowHours:  c.bookingSettings?.cancellationWindowHours  ?? 24,
    bufferBetweenAppointments:c.bookingSettings?.bufferBetweenAppointments?? 0,
    cancellationPolicy:       c.bookingSettings?.cancellationPolicy       ?? '',
    autoConfirm:              c.bookingSettings?.autoConfirm              ?? true,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  const body = await req.json();

  // SECURITY: Whitelist allowed fields to prevent mass assignment
  const allowedFields: Record<string, (v: any) => any> = {
    onlineBookingEnabled: (v) => Boolean(v),
    minAdvanceHours: (v) => Math.max(0, parseInt(v) || 0),
    maxAdvanceDays: (v) => Math.min(365, Math.max(1, parseInt(v) || 60)),
    cancellationWindowHours: (v) => Math.max(0, parseInt(v) || 0),
    bufferBetweenAppointments: (v) => Math.max(0, parseInt(v) || 0),
    cancellationPolicy: (v) => typeof v === 'string' ? v.slice(0, 2000) : '',
    autoConfirm: (v) => Boolean(v),
  };
  const sanitized: Record<string, any> = {};
  for (const [key, transform] of Object.entries(allowedFields)) {
    if (body[key] !== undefined) sanitized[key] = transform(body[key]);
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { customization: true } });
  const c = (shop?.customization as any) || {};
  await prisma.shop.update({
    where: { id: shopId },
    data: { customization: { ...c, bookingSettings: { ...c.bookingSettings, ...sanitized } } },
  });
  return NextResponse.json({ ok: true });
}

