import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    // SECURITY: Validate the date is a real date
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const staffWithLeave = await prisma.user.findMany({
      where: {
        shopId: shopId,
        role: { in: ['STAFF', 'SHOP_ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        workingHours: true,
        leaves: {
          where: {
            date: {
              equals: targetDate,
            },
          },
          select: { id: true },
        },
      },
    });

    // Filter out staff who have leave on the selected date
    const availableStaff = staffWithLeave.filter((staff: any) => staff.leaves.length === 0);

    // SECURITY: Only return minimal public data — no emails, phone, or internal fields
    const staffToReturn = availableStaff.map((s: any) => ({
      id: s.id, 
      name: s.name || 'Staff Member',
      workingHours: s.workingHours
    }));

    return NextResponse.json(staffToReturn);
  } catch (error) {
    logger.error("Error fetching staff availability:", error);
    return NextResponse.json({ error: 'Failed to fetch staff availability' }, { status: 500 });
  }
}
