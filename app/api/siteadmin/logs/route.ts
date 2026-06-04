import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: _authUser } } = await supabase.auth.getUser();
    const session = _authUser ? { user: _authUser } : null;
    const user = session?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (dbUser?.role !== 'SITE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const shopId = searchParams.get('shopId');

    const where: any = {};
    if (level) where.level = level;
    if (status === 'resolved') where.isResolved = true;
    if (status === 'unresolved') where.isResolved = false;
    
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (shopId) where.shopId = shopId;

    const [logsData, total, shops] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.systemLog.count({ where }),
      // Get distinct shops that have logs for the filter dropdown
      prisma.systemLog.findMany({
        where: { shopId: { not: null } },
        select: { shopId: true },
        distinct: ['shopId'],
      }).then(async (results) => {
        const shopIds = results.map(r => r.shopId!).filter(Boolean);
        if (shopIds.length === 0) return [];
        const shopRecords = await prisma.shop.findMany({
          where: { id: { in: shopIds } },
          select: { id: true, name: true },
        });
        return shopRecords;
      }),
    ]);

    let nextCursor = null;
    if (logsData.length > limit) {
      const nextItem = logsData.pop();
      nextCursor = nextItem!.id;
    }

    // Resolve shop names for each log
    const shopIds = Array.from(new Set(logsData.map(l => l.shopId).filter(Boolean))) as string[];
    const shopMap = new Map<string, string>();
    if (shopIds.length > 0) {
      const shopRecords = await prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, name: true },
      });
      shopRecords.forEach(s => shopMap.set(s.id, s.name));
    }

    const logsWithShop = logsData.map(l => ({
      ...l,
      shopName: l.shopId ? (shopMap.get(l.shopId) || l.shopId) : null,
    }));

    return NextResponse.json({
      logs: logsWithShop,
      shops,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: _authUser } } = await supabase.auth.getUser();
    const session = _authUser ? { user: _authUser } : null;
    const user = session?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (dbUser?.role !== 'SITE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, isResolved } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const updatedLog = await prisma.systemLog.update({
      where: { id },
      data: { isResolved }
    });

    return NextResponse.json({ success: true, log: updatedLog });
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: _authUser } } = await supabase.auth.getUser();
    const session = _authUser ? { user: _authUser } : null;
    const user = session?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (dbUser?.role !== 'SITE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.systemLog.delete({ where: { id } });
    } else {
      // Clear all logs older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
