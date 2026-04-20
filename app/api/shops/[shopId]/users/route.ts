import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is SHOP_ADMIN or SITE_ADMIN for this shop
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.role !== 'SITE_ADMIN' && 
        (currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } }))))) {
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

    // SECURITY: Only SITE_ADMIN can assign the SHOP_ADMIN role — prevent privilege escalation
    if (role === 'SHOP_ADMIN' && currentUser.role !== 'SITE_ADMIN') {
      return NextResponse.json(
        { error: 'Only Site Admins can assign the Shop Admin role' },
        { status: 403 }
      );
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Generate a unique barcode for the user based on their email and a secret
    const userBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    let user;

    if (existingUser) {
      if (existingUser.shopId === shopId) {
        user = await prisma.user.update({
          where: { email },
          data: {
            role: role,
            canManageInventory: role === 'STAFF' ? Boolean(canManageInventory) : false,
          }
        });
      } else if (existingUser.shopId === null || existingUser.role === 'CLIENT') {
        user = await prisma.user.update({
          where: { email },
          data: {
            role: role,
            canManageInventory: role === 'STAFF' ? Boolean(canManageInventory) : false,
            shopId: shopId,
          }
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
              id: `invited_${crypto.randomBytes(8).toString('hex')}`, // More robust temporary ID
              email: email,
              role: role,
              canManageInventory: role === 'STAFF' ? Boolean(canManageInventory) : false,
              shopId: shopId,
              barcode: userBarcode,
          }
      });
    }
    
    // Safety check: if an existing user had no barcode, we must add it now
    if (!user.barcode) {
        await prisma.user.update({
            where: { email: email },
            data: { barcode: userBarcode }
        });
        user.barcode = userBarcode;
    }

    // SECURITY: Return only safe fields — don't leak googleRefreshToken etc.
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopId,
      barcode: user.barcode,
      canManageInventory: user.canManageInventory,
    }, { status: 200 });
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
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;

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
        (currentUser.role !== 'SITE_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))) &&
         (currentUser.role !== 'STAFF' || (currentUser.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Restrict what users are visible based on role
    const whereClause: any = { shopId: shopId };
    if (currentUser.role === 'SITE_ADMIN') {
      // Site admins only manage shop admins and see the kiosk
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
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is SHOP_ADMIN or SITE_ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || 
        (currentUser.role !== 'SITE_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))))) {
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

    if (!user || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
      return NextResponse.json(
        { error: 'User not found in this shop' },
        { status: 404 }
      );
    }

    // SECURITY: SHOP_ADMIN cannot remove other SHOP_ADMINs — only SITE_ADMIN can
    if (user.role === 'SHOP_ADMIN' && currentUser.role !== 'SITE_ADMIN') {
      return NextResponse.json(
        { error: 'Only Site Admins can remove Shop Admins' },
        { status: 403 }
      );
    }

    // Remove user from shop
    if (user.shopId === shopId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          shopId: null,
          role: 'CLIENT',
          canManageInventory: false,
        },
      });
    }

    await prisma.shopAccess.deleteMany({
      where: { userId: targetUserId, shopId }
    });

    return NextResponse.json({ success: true, userId: targetUserId }, { status: 200 });
  } catch (error) {
    logger.error('Error removing user from shop:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from shop' },
      { status: 500 }
    );
  }
}
