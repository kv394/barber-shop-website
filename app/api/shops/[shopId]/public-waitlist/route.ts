import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);

    // TODO: Add rate limiting to prevent abuse (e.g., rateLimit(`public-waitlist:${ip}`, 5, 60))

    const body = await request.json();
    const { clientName, clientPhone, serviceId, partySize } = body;

    if (!clientName || String(clientName).trim().length === 0) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // SECURITY: Atomic position calculation + create to prevent duplicate positions
    const entry = await tenantClient.$transaction(async (tx: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastEntry = await tx.waitlist.findFirst({
        where: { shopId: shopId, createdAt: { gte: today } },
        orderBy: { position: 'desc' },
      });

      return tx.waitlist.create({
        data: {
          clientName: String(clientName).slice(0, 200),
          clientPhone: clientPhone ? String(clientPhone).slice(0, 30) : null,
          partySize: Math.max(1, parseInt(partySize) || 1),
          serviceId: serviceId || null,
          position: (lastEntry?.position || 0) + 1,
          shopId: shopId,
        },
      });
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json(entry, { status: 201, headers: corsHeaders });
  } catch (error) {
    logger.error('Error adding to public waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500, headers: corsHeaders }
    );
  }
}
