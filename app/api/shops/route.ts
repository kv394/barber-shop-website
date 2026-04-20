import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rate-limiter';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Function to handle GET requests (List all shops)
export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`shops-get:${ip}`, 30, 60); // 30 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    // Check if caller is authenticated SITE_ADMIN — if so, include users for admin UI
    let isSiteAdmin = false;
    try {
      const supabase = await createClient();
      const { data: { user: authUserSession } } = await supabase.auth.getUser();
      let userId = authUserSession?.id;
      const authUserEmail = authUserSession?.email;
      if (userId) {
        const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { role: true } });
        isSiteAdmin = caller?.role === 'SITE_ADMIN';
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
        // Only include user roles for SITE_ADMIN (needed for home page status badges)
        ...(isSiteAdmin ? { users: { select: { role: true } } } : {}),
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
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`shops-post:${ip}`, 5, 60); // 5 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // HARDENING: Site Admins and Shop Admins can create shops.
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!requestUser || !['SITE_ADMIN', 'SHOP_ADMIN'].includes(requestUser.role)) {
        return NextResponse.json({ error: 'Forbidden. Only Admins can provision shops.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, kioskEmail, adminEmail, address, companyName } = body;

    // HARDENING: Input validation & sanitization
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Valid Shop Name is required' }, { status: 400 });
    }
    
    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json({ error: 'Valid Shop Location Address is required' }, { status: 400 });
    }
    
    if (!kioskEmail || typeof kioskEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(kioskEmail)) {
        return NextResponse.json({ error: 'Valid Kiosk Email is required' }, { status: 400 });
    }

    if (adminEmail && (typeof adminEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(adminEmail))) {
        return NextResponse.json({ error: 'Admin Email must be a valid email format' }, { status: 400 });
    }

    const sanitizedName = name.trim();
    
    const existingShop = await prisma.shop.findFirst({
        where: { name: { equals: sanitizedName, mode: 'insensitive' } }
    });
    if (existingShop) {
        return NextResponse.json({ error: 'A location with this name already exists' }, { status: 400 });
    }

    const sanitizedDesc = description ? String(description).trim() : null;
    const sanitizedAddress = address.trim();
    const sanitizedCompanyName = companyName && typeof companyName === 'string' && companyName.trim() !== '' ? companyName.trim() : null;
    const sanitizedKioskEmail = kioskEmail.trim().toLowerCase();
    const sanitizedAdminEmail = adminEmail ? adminEmail.trim().toLowerCase() : null;

    // Load default customization and add address
    const { DEFAULT_CUSTOMIZATION } = await import('@/lib/templates');
    const customization = { ...DEFAULT_CUSTOMIZATION, address: sanitizedAddress };

    // 1. Create the shop
    const newShop = await prisma.shop.create({
      data: {
        name: sanitizedName,
        companyName: sanitizedCompanyName,
        description: sanitizedDesc,
        customization: customization as any,
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
        const existingAdmin = await prisma.user.findUnique({ where: { email: sanitizedAdminEmail } });

        if (existingAdmin) {
            if (existingAdmin.shopId === null || existingAdmin.role === 'CLIENT') {
                await prisma.user.update({
                    where: { email: sanitizedAdminEmail },
                    data: { role: 'SHOP_ADMIN', shopId: newShop.id }
                });
            } else {
                await prisma.shopAccess.upsert({
                    where: { userId_shopId: { userId: existingAdmin.id, shopId: newShop.id } },
                    update: { role: 'SHOP_ADMIN' },
                    create: { userId: existingAdmin.id, shopId: newShop.id, role: 'SHOP_ADMIN' }
                });
            }
        } else {
            await prisma.user.create({
                data: {
                    id: `admin_init_${newShop.id}`,
                    email: sanitizedAdminEmail,
                    role: 'SHOP_ADMIN',
                    shopId: newShop.id,
                    barcode: adminBarcode
                }
            });
        }
    }

    // 4. If a SHOP_ADMIN created this shop and they weren't explicitly added via adminEmail, grant them access
    if (requestUser.role === 'SHOP_ADMIN' && requestUser.email !== sanitizedAdminEmail) {
        await prisma.shopAccess.create({
            data: {
                userId: requestUser.id,
                shopId: newShop.id,
                role: 'SHOP_ADMIN'
            }
        });
    }

    // 5. Clear user's layout cache so the new shop immediately appears in their switcher
    const cacheIdentifier = authUserEmail || userId;
    if (cacheIdentifier) {
        await cacheService.invalidatePattern(`shop_layout:${cacheIdentifier}:*`);
    }

    return NextResponse.json(newShop, { status: 201 });

  } catch (error: any) {
    logger.error("Error creating shop:", error);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
