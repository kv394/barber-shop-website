import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId');

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'serviceId and date query parameters are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cacheKey = `available_slots:${shopId}:${serviceId}:${staffId || 'all'}:${date}`;

    const slots = await cacheService.getOrSet(cacheKey, async () => {
      const tenantClient = await getTenantClient(shopId);

      // Look up the service to get its duration
      const service = await tenantClient.service.findUnique({
        where: { id: serviceId },
        select: { id: true, duration: true, shopId: true },
      });

      if (!service) {
        return null; // Signal not found
      }

      // Find staff members who can perform the service
      let staffMembers: any[];
      if (staffId) {
        // If a specific staffId is provided, only check that staff member
        const staff = await tenantClient.user.findFirst({
          where: {
            id: staffId,
            OR: [
              { shopId: shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } },
              { shopAccesses: { some: { shopId: shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } } } },
            ],
          },
          select: { id: true, name: true },
        });
        staffMembers = staff ? [staff] : [];
      } else {
        // Use all staff at the shop with role STAFF or SHOP_ADMIN
        staffMembers = await tenantClient.user.findMany({
          where: {
            OR: [
              { shopId: shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } },
              { shopAccesses: { some: { shopId: shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } } } },
            ],
          },
          select: { id: true, name: true },
        });
      }

      if (staffMembers.length === 0) {
        return { slots: [] };
      }

      // Build day boundaries for the requested date
      const dayStart = new Date(`${date}T09:00:00`);
      const dayEnd = new Date(`${date}T17:00:00`);

      // Fetch existing appointments for all relevant staff on this date
      const dateStart = new Date(`${date}T00:00:00`);
      const dateEnd = new Date(`${date}T23:59:59`);

      const existingAppointments = await tenantClient.appointment.findMany({
        where: {
          shopId: shopId,
          staffId: { in: staffMembers.map((s: any) => s.id) },
          status: { not: 'CANCELLED' },
          startTime: { lt: dateEnd },
          endTime: { gt: dateStart },
        },
        select: { staffId: true, startTime: true, endTime: true },
      });

      // Generate 30-minute interval time slots from 9:00 AM to 5:00 PM
      const availableSlots: { time: string; staffId: string; staffName: string }[] = [];
      const serviceDurationMs = service.duration * 60 * 1000;

      for (const staff of staffMembers) {
        const staffAppointments = existingAppointments.filter(
          (a: any) => a.staffId === staff.id
        );

        let slotTime = new Date(dayStart);
        while (slotTime < dayEnd) {
          const slotEnd = new Date(slotTime.getTime() + serviceDurationMs);

          // Check if this slot conflicts with any existing appointment
          const hasConflict = staffAppointments.some((a: any) => {
            const apptStart = new Date(a.startTime);
            const apptEnd = new Date(a.endTime);
            return slotTime < apptEnd && slotEnd > apptStart;
          });

          if (!hasConflict && slotEnd <= dayEnd) {
            const hours = slotTime.getHours().toString().padStart(2, '0');
            const minutes = slotTime.getMinutes().toString().padStart(2, '0');
            availableSlots.push({
              time: `${hours}:${minutes}`,
              staffId: staff.id,
              staffName: staff.name || 'Staff',
            });
          }

          // Move to next 30-minute interval
          slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
        }
      }

      return { slots: availableSlots };
    }, 300); // 5-minute TTL

    if (slots === null) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(slots, { headers: corsHeaders });
  } catch (error) {
    logger.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500, headers: corsHeaders }
    );
  }
}
