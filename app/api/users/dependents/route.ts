import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dependents = await prisma.user.findMany({
      where: {
        parentId: authUser.id,
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(dependents);
  } catch (error) {
    logger.error("Error fetching dependents:", error);
    return NextResponse.json({ error: 'Failed to fetch dependents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine the shop ID from the parent if possible, or null
    const parentUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { shopId: true },
    });

    // Create a new User record for the dependent
    // We generate a dummy email because email is marked as unique in the schema
    const dependentId = `dep_${Math.random().toString(36).substring(2, 11)}`;
    const dummyEmail = `dependent-${dependentId}@shophub.local`;

    const newDependent = await prisma.user.create({
      data: {
        id: dependentId,
        name: name,
        email: dummyEmail,
        role: 'CLIENT',
        parentId: authUser.id,
        shopId: parentUser?.shopId,
        marketingConsent: false,
      },
    });

    return NextResponse.json({
      id: newDependent.id,
      name: newDependent.name,
    }, { status: 201 });
  } catch (error) {
    logger.error("Error creating dependent:", error);
    return NextResponse.json({ error: 'Failed to create dependent' }, { status: 500 });
  }
}
