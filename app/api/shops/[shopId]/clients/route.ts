import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || 
        (currentUser.role !== 'SUPER_ADMIN' && 
         (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== shopId) &&
         (currentUser.role !== 'STAFF' || currentUser.shopId !== shopId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all clients associated with this shop directly OR who have made an appointment here
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
            { shopId: shopId },
            { clientAppointments: { some: { shopId: shopId } } }
        ]
      },
      include: {
          _count: {
              select: {
                  clientAppointments: {
                      where: { shopId: shopId }
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
