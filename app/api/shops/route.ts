import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Function to handle GET requests (List all shops)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    // Check if caller is authenticated SUPER_ADMIN — if so, include users for admin UI
    let isSuperAdmin = false;
    try {
      const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
      if (userId) {
        const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        isSuperAdmin = caller?.role === 'SUPER_ADMIN';
      }
    } catch { /* unauthenticated — public access */ }

    const shops = await prisma.shop.findMany({
      take: Math.min(take, 100), 
      skip: Math.max(skip, 0),
      select: {
        id: true,
        name: true,
        template: true,
        description: true,
        createdAt: true,
        _count: {
          select: { users: { where: { role: 'SHOP_ADMIN' } } },
        },
        // Only include user roles for SUPER_ADMIN (needed for home page status badges)
        ...(isSuperAdmin ? { users: { select: { role: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(shops);
  } catch (error) {
    logger.error("Error fetching shops:", error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}

// Function to handle POST requests (Create a new shop)
export async function POST(request: Request) {
  try {
    // HARDENING: Only Super Admins can create shops. Enforce server-side authorization.
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!requestUser || requestUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Only Super Admins can provision shops.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, kioskEmail, adminEmail } = body;

    // HARDENING: Input validation & sanitization
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Valid Shop Name is required' }, { status: 400 });
    }
    
    if (!kioskEmail || typeof kioskEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(kioskEmail)) {
        return NextResponse.json({ error: 'Valid Kiosk Email is required' }, { status: 400 });
    }

    if (adminEmail && (typeof adminEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(adminEmail))) {
        return NextResponse.json({ error: 'Admin Email must be a valid email format' }, { status: 400 });
    }

    const sanitizedName = name.trim();
    const sanitizedDesc = description ? String(description).trim() : null;
    const sanitizedKioskEmail = kioskEmail.trim().toLowerCase();
    const sanitizedAdminEmail = adminEmail ? adminEmail.trim().toLowerCase() : null;


    // 1. Create the shop
    const newShop = await prisma.shop.create({
      data: {
        name: sanitizedName,
        description: sanitizedDesc,
      },
    });

    // 2. Create or update the Kiosk User placeholder
    const kioskBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();
    await prisma.user.upsert({
        where: { email: sanitizedKioskEmail },
        update: {
            role: 'ATTENDANCE_KIOSK',
            shopId: newShop.id,
        },
        create: {
            id: `kiosk_init_${newShop.id}`,
            email: sanitizedKioskEmail,
            name: `${sanitizedName} Kiosk`,
            role: 'ATTENDANCE_KIOSK',
            shopId: newShop.id,
            barcode: kioskBarcode
        }
    });

    // 3. If an admin email was provided, create or update that user as the Shop Admin
    if (sanitizedAdminEmail) {
        const adminBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

        await prisma.user.upsert({
            where: { email: sanitizedAdminEmail },
            update: {
                role: 'SHOP_ADMIN',
                shopId: newShop.id,
            },
            create: {
                id: `admin_init_${newShop.id}`,
                email: sanitizedAdminEmail,
                role: 'SHOP_ADMIN',
                shopId: newShop.id,
                barcode: adminBarcode
            }
        });
    }

    return NextResponse.json(newShop, { status: 201 });

  } catch (error: any) {
    logger.error("Error creating shop:", error);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
