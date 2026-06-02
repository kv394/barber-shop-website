import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const;

/**
 * GET /api/siteadmin/users — List all users with optional filters
 */
export async function GET(request: NextRequest) {
 const adminCheck = await requireSiteAdmin();
 if (adminCheck instanceof NextResponse) return adminCheck;

 const { searchParams } = new URL(request.url);
 const search = searchParams.get('search') || '';
 const role = searchParams.get('role') || '';
 const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
 const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

 const where: any = {};

 if (role && VALID_ROLES.includes(role as any)) {
 where.role = role;
 }

 if (search) {
 where.OR = [
 { email: { contains: search, mode: 'insensitive' } },
 { name: { contains: search, mode: 'insensitive' } },
 ];
 }

 const [users, total] = await Promise.all([
 prisma.user.findMany({
 where,
 take: limit,
 skip,
 select: {
 id: true,
 email: true,
 name: true,
 role: true,
 shopId: true,
 shop: { select: { name: true, companyName: true } },
 createdAt: true,
 },
 orderBy: { createdAt: 'desc' },
 }),
 prisma.user.count({ where }),
 ]);

 return NextResponse.json({
 users: users.map((u: any) => ({
 id: u.id,
 email: u.email,
 name: u.name,
 role: u.role,
 shopId: u.shopId,
 shopName: u.shop ? (u.shop.companyName ? `${u.shop.companyName} (${u.shop.name})` : u.shop.name) : null,
 createdAt: u.createdAt.toISOString(),
 })),
 total,
 });
}

/**
 * PATCH /api/siteadmin/users — Change a user's role
 */
export async function PATCH(request: NextRequest) {
 const adminCheck = await requireSiteAdmin();
 if (adminCheck instanceof NextResponse) return adminCheck;

 const body = await request.json();
 const { userId: targetUserId, role } = body;

 if (!targetUserId || typeof targetUserId !== 'string') {
 return NextResponse.json({ error: 'userId is required' }, { status: 400 });
 }

 if (!role || !VALID_ROLES.includes(role)) {
 return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
 }

 // Prevent demoting yourself
 if (targetUserId === adminCheck.id && role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'You cannot demote yourself from SITE_ADMIN' }, { status: 400 });
 }

 const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
 if (!targetUser) {
 return NextResponse.json({ error: 'User not found' }, { status: 404 });
 }

 // If changing to a shop-specific role but user has no shop, warn
 if (['SHOP_ADMIN', 'STAFF', 'ATTENDANCE_KIOSK'].includes(role) && !targetUser.shopId) {
 // Allow it but user won't be able to access a shop until assigned
 }

 const updated = await prisma.user.update({
 where: { id: targetUserId },
 data: { role: role as any },
 select: { id: true, email: true, name: true, role: true, shopId: true },
 });

 return NextResponse.json(updated);
}

