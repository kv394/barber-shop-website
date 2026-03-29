import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || 
        (currentUser.role !== 'SUPER_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId) &&
         (currentUser.role !== 'STAFF' || currentUser.shopId !== params.shopId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all clients associated with this shop directly OR who have made an appointment here
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
            { shopId: params.shopId },
            { clientAppointments: { some: { shopId: params.shopId } } }
        ]
      },
      include: {
          _count: {
              select: {
                  clientAppointments: {
                      where: { shopId: params.shopId }
                  }
              }
          }
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['id']
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
