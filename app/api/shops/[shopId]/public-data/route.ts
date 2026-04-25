import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;

    // Run all public data queries in parallel
    const [products, services, staff, reviews] = await Promise.all([
      // 1. Sellable Products
      prisma.product.findMany({
        where: { shopId, isSellable: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          type: true,
          trackInventory: true,
          inventoryCount: true
        },
        orderBy: { name: 'asc' }
      }),
      // 2. Bookable Services
      prisma.service.findMany({
        where: { shopId, isBookable: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          imageUrl: true,
          addons: { select: { id: true, name: true, price: true, durationMin: true } }
        },
        orderBy: { name: 'asc' }
      }),
      // 3. Public Staff 
      // Assuming all STAFF are public, or we can filter by their role
      prisma.user.findMany({
        where: {
          OR: [
            { shopId: shopId, role: 'STAFF' },
            { shopAccesses: { some: { shopId: shopId, role: 'STAFF' } } }
          ]
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          workingHours: true
        }
      }),
      // 4. Reviews
      prisma.review.findMany({
        where: { shopId },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to latest 50 reviews for performance
      })
    ]);

    return NextResponse.json({
      products,
      services,
      staff,
      reviews
    });

  } catch (error) {
    logger.error('Error fetching public shop data:', error);
    return NextResponse.json({ error: 'Failed to fetch public data' }, { status: 500 });
  }
}
