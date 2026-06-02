import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

import { requireSiteAdmin } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { shopId } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (role !== 'SHOP_ADMIN' && role !== 'ATTENDANCE_KIOSK') {
      return NextResponse.json({ error: 'Site admin can only assign SHOP_ADMIN or ATTENDANCE_KIOSK' }, { status: 400 });
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const userBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    let user;

    if (existingUser) {
      if (existingUser.shopId === shopId) {
        user = await prisma.user.update({
          where: { email },
          data: { role: role }
        });
      } else if (existingUser.shopId === null || existingUser.role === 'CLIENT') {
        user = await prisma.user.update({
          where: { email },
          data: { role: role, shopId: shopId }
        });
      } else {
        await prisma.shopAccess.upsert({
          where: { userId_shopId: { userId: existingUser.id, shopId } },
          update: { role },
          create: { userId: existingUser.id, shopId, role }
        });
        user = existingUser;
      }
    } else {
      user = await prisma.user.create({
        data: {
          id: `invited_${crypto.randomBytes(8).toString('hex')}`,
          email: email,
          role: role,
          shopId: shopId,
          barcode: userBarcode,
        }
      });
    }

    if (!user.barcode) {
      await prisma.user.update({ where: { email }, data: { barcode: userBarcode } });
    }

    return NextResponse.json({ success: true, user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error assigning user to shop:', error);
    return NextResponse.json({ error: 'Failed to assign user' }, { status: 500 });
  }
}
