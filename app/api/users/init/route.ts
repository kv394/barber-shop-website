import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, name } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    // Check if user already exists
    const userById = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (userById) {
      return NextResponse.json(userById, { status: 200 });
    }

    // Check if this is an invited user
    const userByEmail = await prisma.user.findUnique({
      where: { email: email },
    });

    if (userByEmail) {
      // Transaction to ensure invited user is claimed correctly
      const finalUser = await prisma.$transaction(async (tx) => {
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
    
    const userBarcode = crypto.createHash('sha256').update(`${email}-${process.env.JWT_SECRET || 'secret'}`).digest('hex').substring(0, 12).toUpperCase();
    
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
      { error: 'Failed to initialize user profile. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
