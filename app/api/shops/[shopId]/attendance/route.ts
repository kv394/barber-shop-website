import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
    try {
    const { shopId } = await params;
        // Require at least STAFF role to view active attendance logs
        const authResult = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN', 'STAFF', 'ATTENDANCE_KIOSK']);
        if (isAuthError(authResult)) return authResult;

        // Find all active time logs for the given shop
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeLogs = await prisma.timeLog.findMany({
            where: {
                shopId: shopId,
                clockIn: {
                    gte: today, // Only show logs from today
                },
                clockOut: null, // Only show users who are currently clocked IN
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
                clockIn: 'asc'
            }
        });

        return NextResponse.json(activeLogs);

    } catch (error: any) {
        logger.error('Error fetching active logs:', error);
        return NextResponse.json({ error: 'Failed to fetch active logs' }, { status: 500 });
    }
}


export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

    // Verify the scanner device is logged in. 
    // It can be a Shop Admin, Staff, or a dedicated KIOSK user.
    if (!userId) {
       return NextResponse.json({ error: 'Scanner device is unauthorized' }, { status: 401 });
    }

    const scannerUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!scannerUser || 
        (scannerUser.role !== 'SUPER_ADMIN' && 
         scannerUser.role !== 'SHOP_ADMIN' && 
         scannerUser.role !== 'STAFF' &&
         scannerUser.role !== 'ATTENDANCE_KIOSK')) {
      return NextResponse.json({ error: 'This device does not have permission to scan.' }, { status: 403 });
    }

    // Ensure the scanner is assigned to this shop (unless Super Admin)
    if (scannerUser.role !== 'SUPER_ADMIN' && scannerUser.shopId !== shopId) {
       return NextResponse.json({ error: 'This device is not assigned to this shop.' }, { status: 403 });
    }

    const body = await request.json();
    const { barcode } = body;

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Find the user by their barcode AND ensure they belong to this shop
    const user = await prisma.user.findFirst({
      where: {
        barcode: barcode,
        shopId: shopId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ID Card not recognized for this shop.' }, { status: 404 });
    }

    // Check if they are already clocked in/checked in (have a TimeLog with no clockOut)
    const activeLog = await prisma.timeLog.findFirst({
      where: {
        userId: user.id,
        shopId: shopId,
        clockOut: null,
      },
    });

    if (activeLog) {
      // They are checked in, so check them OUT
      const updatedLog = await prisma.timeLog.update({
        where: { id: activeLog.id },
        data: { clockOut: new Date() },
      });
      return NextResponse.json({ 
        message: 'Checked OUT successfully', 
        user: { name: user.name || user.email }, 
        role: user.role,
        action: 'OUT',
        time: updatedLog.clockOut
      }, { status: 200 });
    } else {
      // They are not checked in, so check them IN
      const newLog = await prisma.timeLog.create({
        data: {
          userId: user.id,
          shopId: shopId,
          // clockIn is automatically set to now()
        },
      });
      return NextResponse.json({ 
        message: 'Checked IN successfully',
        user: { name: user.name || user.email },
        role: user.role,
        action: 'IN',
        time: newLog.clockIn
      }, { status: 200 });
    }

  } catch (error: any) {
    logger.error('Error processing attendance:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    );
  }
}
