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

        // Verify user has permission to view logs for this shop
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all time logs for the current day for the given shop
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const logs = await prisma.timeLog.findMany({
            where: {
                shopId: params.shopId,
                clockIn: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                clockIn: 'desc'
            }
        });

        return NextResponse.json(logs);

    } catch (error: any) {
        logger.error('Error fetching attendance logs:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance logs' }, { status: 500 });
    }
}
