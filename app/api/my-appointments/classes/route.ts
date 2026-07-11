import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
      include: {
        dependents: true,
        shopClients: { select: { shopId: true } }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shopIds = parent.shopClients.map(sc => sc.shopId);

    // Get family IDs (parent + dependents)
    const familyIds = [parent.id, ...parent.dependents.map(d => d.id)];

    // Fetch active class schedules in associated shops
    const classes = await prisma.classSchedule.findMany({
      where: { shopId: { in: shopIds } },
      include: {
        service: {
          select: { id: true, name: true, description: true, price: true, duration: true }
        },
        staff: {
          select: { id: true, name: true, imageUrl: true }
        },
        shop: {
          select: { id: true, name: true }
        },
        term: {
          select: { id: true, name: true, startDate: true, endDate: true }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Fetch active enrollments for the family
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: { in: familyIds },
        status: 'ACTIVE'
      },
      include: {
        student: { select: { id: true, name: true, role: true } },
        classSchedule: {
          include: {
            service: { select: { id: true, name: true } },
            shop: { select: { id: true, name: true } },
            term: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      classes,
      enrollments,
      family: [
        { id: parent.id, name: parent.name, role: 'PARENT' },
        ...parent.dependents.map(d => ({ id: d.id, name: d.name, role: 'DEPENDENT' }))
      ]
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
