import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateCommissionsForAppointments } from '@/lib/commissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shops/[shopId]/commissions
 * Calculate commission report for completed appointments in a date range.
 */
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const { shopId } = await params;

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const isStaff = user?.role === 'STAFF' && user?.shopId === shopId;
 if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN' && !isStaff)) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 if (user.role === 'SHOP_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const startDate = searchParams.get('start');
 const endDate = searchParams.get('end');
 // STAFF can only view their own earnings — ignore any staffId query param and force their own id
 const staffIdFilter = isStaff ? userId : searchParams.get('staffId');

 const where: any = { shopId, status: 'COMPLETED' as const };
 if (startDate) where.updatedAt = { ...where.updatedAt, gte: new Date(startDate) };
 if (endDate) where.updatedAt = { ...where.updatedAt, lte: new Date(endDate + 'T23:59:59') };
 if (staffIdFilter) where.staffId = staffIdFilter;

 const appointments = await prisma.appointment.findMany({
 where,
 include: {
 service: { select: { price: true, name: true } },
 staff: { select: { name: true } },
 },
 orderBy: { updatedAt: 'desc' },
 take: 500,
 });

 const results = await calculateCommissionsForAppointments(shopId, appointments as any);

 // Aggregate by staff
 const staffSummary: Record<string, {
 staffName: string;
 servicesCount: number;
 grossRevenue: number;
 totalCommission: number;
 totalTips: number;
 totalPayout: number;
 }> = {};

 for (const r of results) {
 if (!staffSummary[r.staffId]) {
 staffSummary[r.staffId] = {
 staffName: r.staffName,
 servicesCount: 0,
 grossRevenue: 0,
 totalCommission: 0,
 totalTips: 0,
 totalPayout: 0,
 };
 }
 const s = staffSummary[r.staffId];
 s.servicesCount++;
 s.grossRevenue += r.serviceAmount;
 s.totalCommission += r.commission;
 s.totalTips += r.tipAmount;
 s.totalPayout += r.commission + r.tipAmount;
 }

 const rules = await prisma.commissionRule.findMany({
 where: { shopId }
 });

 return NextResponse.json({
 rules,
 details: results,
 summary: Object.entries(staffSummary).map(([staffId, data]) => ({
 staffId,
 ...data,
 grossRevenue: Math.round(data.grossRevenue * 100) / 100,
 totalCommission: Math.round(data.totalCommission * 100) / 100,
 totalTips: Math.round(data.totalTips * 100) / 100,
 totalPayout: Math.round(data.totalPayout * 100) / 100,
 })),
 });
}

/**
 * POST /api/shops/[shopId]/commissions
 * Create or update a commission rule.
 */
export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const { shopId } = await params;
 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 const { staffId, serviceId, rateType, rateValue } = body;

 if (!rateType || rateValue === undefined) {
 return NextResponse.json({ error: 'rateType and rateValue are required' }, { status: 400 });
 }

 const parsedRate = parseFloat(rateValue);
 if (isNaN(parsedRate) || parsedRate < 0) {
 return NextResponse.json({ error: 'rateValue must be a non-negative number' }, { status: 400 });
 }
 // SECURITY: Percentage rates must be 0-100
 if (rateType === 'PERCENTAGE' && parsedRate > 100) {
 return NextResponse.json({ error: 'Percentage rate cannot exceed 100' }, { status: 400 });
 }

 // SECURITY: Verify staffId belongs to this shop (prevent cross-shop commission assignment)
 if (staffId) {
 const targetStaff = await prisma.user.findUnique({ where: { id: staffId }, select: { id: true, shopId: true } });
 if (!targetStaff || (targetStaff.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: targetStaff.id, shopId } })))) {
 return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
 }
 }

 // SECURITY: Verify serviceId belongs to this shop (prevent cross-shop service reference)
 if (serviceId) {
 const targetService = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true, shopId: true } });
 if (!targetService || targetService.shopId !== shopId) {
 return NextResponse.json({ error: 'Service not found in this shop' }, { status: 404 });
 }
 }

 const rule = await prisma.commissionRule.create({
 data: {
 shopId,
 staffId: staffId || null,
 serviceId: serviceId || null,
 rateType: rateType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
 rateValue: parsedRate,
 },
 });

 return NextResponse.json(rule, { status: 201 });
}

