import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is SHOP_ADMIN or SUPER_ADMIN for this shop
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.role !== 'SUPER_ADMIN' && 
        (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to manage this shop' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role, canManageInventory } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: params.shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Generate a unique barcode for the user based on their email and a secret
    const userBarcode = crypto.createHash('sha256').update(`${email}-${process.env.JWT_SECRET || 'secret'}`).digest('hex').substring(0, 12).toUpperCase();

    // Use upsert to handle both creation and updating of existing placeholder users
    const user = await prisma.user.upsert({
        where: { email: email },
        update: {
            role: role,
            canManageInventory: role === 'STAFF' ? Boolean(canManageInventory) : false,
            shopId: params.shopId,
        },
        create: {
            id: `invited_${crypto.randomBytes(8).toString('hex')}`, // More robust temporary ID
            email: email,
            role: role,
            canManageInventory: role === 'STAFF' ? Boolean(canManageInventory) : false,
            shopId: params.shopId,
            barcode: userBarcode,
        }
    });
    
    // Safety check: if an existing user had no barcode, we must add it now
    if (!user.barcode) {
        await prisma.user.update({
            where: { email: email },
            data: { barcode: userBarcode }
        });
        user.barcode = userBarcode;
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error('Error assigning user to shop:', error);
    return NextResponse.json(
      { error: 'Failed to assign user to shop' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this shop
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || 
        (currentUser.role !== 'SUPER_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId) &&
         (currentUser.role !== 'STAFF' || currentUser.shopId !== params.shopId))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Restrict what users are visible based on role
    const whereClause: any = { shopId: params.shopId };
    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admins only manage shop admins and see the kiosk
      whereClause.role = { in: ['SHOP_ADMIN', 'ATTENDANCE_KIOSK'] };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canManageInventory: true,
        barcode: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    logger.error('Error fetching shop users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop users' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is SHOP_ADMIN or SUPER_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || 
        (currentUser.role !== 'SUPER_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent removing yourself
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the shop' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.shopId !== params.shopId) {
      return NextResponse.json(
        { error: 'User not found in this shop' },
        { status: 404 }
      );
    }

    // Remove user from shop
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        shopId: null,
        role: 'CLIENT',
        canManageInventory: false,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    logger.error('Error removing user from shop:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from shop' },
      { status: 500 }
    );
  }
}
