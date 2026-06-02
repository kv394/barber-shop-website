import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/siteadmin/shops — Detailed shop listing for site admin
 */
export async function GET() {
 const supabase = await createClient();
   const { data: { session } } = await supabase.auth.getSession();
   const authUser = session?.user;
   if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 const userId = authUser.id;
 const authUserEmail = authUser.email;

 const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { role: true } });
 if (!dbUser || dbUser.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const shops = await prisma.shop.findMany({
 take: 100,
 orderBy: { createdAt: 'desc' },
 select: {
 id: true,
 name: true,
 companyName: true,
 template: true,
 createdAt: true,
 isActive: true,
 deletedAt: true,
 aiTokens: true,
 premiumFeatures: true,
 _count: {
 select: {
 users: true,
 services: true,
 reviews: true,
 },
 },
 users: {
 where: { role: { in: ['SHOP_ADMIN', 'STAFF'] } },
 select: { id: true, role: true, name: true, email: true },
 orderBy: { role: 'asc' },
 },
 },
 });

 return NextResponse.json({ shops });
}

