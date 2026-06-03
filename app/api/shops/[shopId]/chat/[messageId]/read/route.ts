import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string, messageId: string }> }
) {
  try {
    const { shopId, messageId } = await params;
    const tenantClient = await getTenantClient(shopId);
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return new Response('Unauthorized', { status: 401 });
    const userId = authUser.id;
    const authUserEmail = authUser.email;

    const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
      return new Response('Forbidden', { status: 403 });
    }

    if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF') {
      return new Response('Forbidden', { status: 403 });
    }

    // Upsert to mark as read without duplicating
    await tenantClient.messageReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: user.id
        }
      },
      update: {},
      create: {
        messageId,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { shopId } = await params;
    logger.error("Error marking message read:", error, { path: `/api/shops/${shopId}/chat/read`, shopId });
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
