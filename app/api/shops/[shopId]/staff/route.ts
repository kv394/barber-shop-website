import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const targetDate = new Date(dateStr);

    const staffWithLeave = await prisma.user.findMany({
      where: {
        shopId: params.shopId,
        role: 'STAFF',
      },
      include: {
        leaves: {
          where: {
            date: {
              equals: targetDate,
            },
          },
        },
      },
    });

    // Filter out staff who have leave on the selected date
    const availableStaff = staffWithLeave.filter(staff => staff.leaves.length === 0);

    // We only need to return the name, ID, and working hours
    const staffToReturn = availableStaff.map(s => ({ 
      id: s.id, 
      name: s.name || s.email.split('@')[0],
      workingHours: s.workingHours 
    }));

    return NextResponse.json(staffToReturn);
  } catch (error) {
    logger.error("Error fetching staff availability:", error);
    return NextResponse.json({ error: 'Failed to fetch staff availability' }, { status: 500 });
  }
}
