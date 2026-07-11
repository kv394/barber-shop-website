import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parent = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: {
        id: true,
        dependents: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ dependents: parent.dependents });
  } catch (error) {
    console.error('Error fetching dependents:', error);
    return NextResponse.json({ error: 'Failed to fetch dependents' }, { status: 500 });
  }
}

const createDependentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = createDependentSchema.parse(body);

    const parent = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!parent) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Dependents need a unique email to satisfy Prisma's unique constraint on User.email.
    const fakeEmail = `dependent-${Date.now()}-${Math.random().toString(36).substring(7)}@family.kutzapp.com`;

    const dependent = await prisma.user.create({
      data: {
        name,
        email: fakeEmail,
        role: 'CLIENT',
        parentId: parent.id,
      }
    });

    // We should also link the dependent to the same shops the parent is linked to.
    const parentShops = await prisma.shopClient.findMany({
      where: { userId: parent.id },
      select: { shopId: true }
    });

    if (parentShops.length > 0) {
      await prisma.shopClient.createMany({
        data: parentShops.map(ps => ({
          userId: dependent.id,
          shopId: ps.shopId,
        }))
      });
    }

    return NextResponse.json({ dependent });
  } catch (error: any) {
    console.error('Error creating dependent:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create dependent' }, { status: 500 });
  }
}
