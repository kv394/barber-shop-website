import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateCommissionsForAppointments } from '@/lib/commissions';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const supabase = await createClient();
  const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
  const userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopId } = await params;

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
  const isStaff = user?.role === 'STAFF' && user?.shopId === shopId;
  
  if (!user || (user.role !== 'SHOP_ADMIN' && !isStaff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  if (user.role === 'SHOP_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('start');
  const endDateStr = searchParams.get('end');
  const staffIdFilter = isStaff ? userId : searchParams.get('staffId');

  const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(1));
  const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : new Date();

  try {
    const apptWhere: any = { shopId, status: 'COMPLETED' as const };
    apptWhere.updatedAt = { gte: startDate, lte: endDate };
    if (staffIdFilter) apptWhere.staffId = staffIdFilter;

    const appointments = await prisma.appointment.findMany({
      where: apptWhere,
      include: {
        service: { select: { price: true, name: true } },
        staff: { select: { name: true, employmentType: true } },
      },
      orderBy: { updatedAt: 'desc' }
    });

    const commissionResults = await calculateCommissionsForAppointments(shopId, appointments as any);
    
    const timeWhere: any = { shopId };
    timeWhere.clockIn = { gte: startDate, lte: endDate };
    if (staffIdFilter) timeWhere.userId = staffIdFilter;
    
    const timeLogs = await prisma.timeLog.findMany({
      where: timeWhere,
      include: {
        user: { select: { name: true } }
      }
    });

    const expenseWhere: any = { shopId };
    expenseWhere.date = { gte: startDate, lte: endDate };
    const expenses = await prisma.expense.findMany({
      where: expenseWhere
    });

    const boothWhere: any = { shopId, status: 'COMPLETED' as const };
    boothWhere.createdAt = { gte: startDate, lte: endDate };
    if (staffIdFilter) boothWhere.userId = staffIdFilter;
    const boothRents = await prisma.boothRentPayment.findMany({
      where: boothWhere,
      include: {
        user: { select: { name: true } }
      }
    });

    const staffSummary: Record<string, any> = {};

    for (const r of commissionResults) {
      if (!staffSummary[r.staffId]) {
        staffSummary[r.staffId] = {
          staffId: r.staffId,
          staffName: r.staffName,
          totalCommission: 0,
          totalTips: 0,
          totalHoursWorked: 0,
          boothRentPaid: 0,
          netPayout: 0
        };
      }
      staffSummary[r.staffId].totalCommission += r.commission;
      staffSummary[r.staffId].totalTips += r.tipAmount;
      staffSummary[r.staffId].netPayout += (r.commission + r.tipAmount);
    }

    for (const t of timeLogs) {
      if (!t.clockOut) continue;
      const hours = (t.clockOut.getTime() - t.clockIn.getTime()) / (1000 * 60 * 60);
      if (!staffSummary[t.userId]) {
        staffSummary[t.userId] = {
          staffId: t.userId,
          staffName: t.user.name,
          totalCommission: 0,
          totalTips: 0,
          totalHoursWorked: 0,
          boothRentPaid: 0,
          netPayout: 0
        };
      }
      staffSummary[t.userId].totalHoursWorked += hours;
    }

    for (const b of boothRents) {
      if (!staffSummary[b.userId]) {
        staffSummary[b.userId] = {
          staffId: b.userId,
          staffName: b.user.name,
          totalCommission: 0,
          totalTips: 0,
          totalHoursWorked: 0,
          boothRentPaid: 0,
          netPayout: 0
        };
      }
      staffSummary[b.userId].boothRentPaid += b.amount;
    }

    const summaryArray = Object.values(staffSummary).map((s: any) => ({
      ...s,
      totalCommission: Math.round(s.totalCommission * 100) / 100,
      totalTips: Math.round(s.totalTips * 100) / 100,
      totalHoursWorked: Math.round(s.totalHoursWorked * 100) / 100,
      boothRentPaid: Math.round(s.boothRentPaid * 100) / 100,
      netPayout: Math.round(s.netPayout * 100) / 100,
    }));

    return NextResponse.json({
      summary: summaryArray,
      expenses,
      totalExpenses: expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
      raw: {
        commissions: commissionResults,
        timeLogs,
        boothRents
      }
    });
  } catch (error: any) {
    console.error('Payroll API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
