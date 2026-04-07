import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(`init-user:${ip}`, 10, 60);
  
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;
  // SECURITY: Do NOT trust the email from the client body.
  // Fetch the verified email from Supabase Auth to prevent role-stealing.

  try {
    // Check if user already exists
    const userById = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, include: { shop: true },
    });

    if (userById) {
      // SECURITY: Don't leak sensitive fields like googleRefreshToken
      const { googleRefreshToken, ...safeUser } = userById as any;
      return NextResponse.json(safeUser, { status: 200 });
    }

    // Fetch the verified email from Supabase Auth
    const email = authUserEmail;

    if (!email) {
      return NextResponse.json({ error: 'No email found for this user' }, { status: 400 });
    }

    // Check if this is an invited user (pre-created by admin with this email)
    const userByEmail = await prisma.user.findUnique({
      where: { email: email },
    });

    if (userByEmail) {
      // Transaction to ensure invited user is claimed correctly
      const finalUser = await prisma.$transaction(async (tx: any) => {
        await tx.user.delete({ where: { id: userByEmail.id } });
        const newUser = await tx.user.create({
          data: {
            id: userId,
            email: userByEmail.email,
            name: name || userByEmail.name,
            role: userByEmail.role,
            shopId: userByEmail.shopId,
            barcode: userByEmail.barcode,
            canManageInventory: userByEmail.canManageInventory,
          },
          include: { shop: true },
        });
        return newUser;
      });
      return NextResponse.json(finalUser, { status: 200 });
    }

    // If no user exists, create a new one.
    // Determine if this is the very first user.
    const userCount = await prisma.user.count();
    const roleToAssign = userCount === 0 ? 'SUPER_ADMIN' : 'CLIENT';
    
    const userBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || null,
        role: roleToAssign,
        barcode: userBarcode,
      },
      include: { shop: true },
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    logger.error('Error in user initialization:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user profile.' },
      { status: 500 }
    );
  }
}
