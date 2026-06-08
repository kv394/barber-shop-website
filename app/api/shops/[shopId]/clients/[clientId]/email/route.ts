import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getEmailProviderForShop } from '@/lib/messaging-providers';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
  try {
    const { shopId, clientId } = await params;

    // ── Auth ────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the caller is staff / admin of this shop
    const callerUser = await prisma.user.findFirst({
      where: {
        clerkId: session.userId,
        OR: [
          { shopId, role: 'SHOP_ADMIN' },
          { shopId, role: 'STAFF' },
        ],
      },
      select: { id: true },
    });

    if (!callerUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Input validation ───────────────────────────────────────
    const body = await request.json();
    const { subject, message } = body as { subject?: string; message?: string };

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Look up shop ───────────────────────────────────────────
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, customization: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopName = shop.name;
    const customization = (shop.customization as Record<string, any>) || {};
    const shopReplyTo = customization.contact?.email || customization.email || undefined;

    // ── Look up client user ────────────────────────────────────
    const clientUser = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, email: true, name: true },
    });

    if (!clientUser) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Walk-in clients have placeholder emails — can't send to them
    if (clientUser.email.startsWith('walkin-')) {
      return NextResponse.json(
        { error: 'Cannot send email to a walk-in client' },
        { status: 400 }
      );
    }

    // ── Build branded HTML email ───────────────────────────────
    const escapedShopName = escapeHtml(shopName);
    const escapedMessage = escapeHtml(message.trim());

    const htmlVersion = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <div style="background: #1a1a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 20px; font-weight: 800; color: #fff;">${escapedShopName}</span>
    </div>
    <div style="color: #d4d4dc; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${escapedMessage}</div>
  </div>
  <div style="text-align: center; padding-top: 20px;">
    <p style="color: #5a5a6e; font-size: 11px;">Sent via KutzApp</p>
  </div>
</div>`.trim();

    // ── Send via shop email provider ───────────────────────────
    const provider = await getEmailProviderForShop(shopId);
    const result = await provider.send(
      clientUser.email,
      subject.trim(),
      message.trim(),
      htmlVersion,
      undefined,
      shopName,
      shopReplyTo
    );

    // ── Audit log via Notification record ──────────────────────
    await prisma.notification.create({
      data: {
        shopId,
        userId: clientId,
        type: 'DIRECT_EMAIL',
        channel: 'EMAIL',
        title: subject.trim(),
        message: message.trim(),
        status: result.success ? 'SENT' : 'FAILED',
      },
    });

    if (!result.success) {
      logger.error(`[DIRECT_EMAIL] Failed to send email to client ${clientId} in shop ${shopId}: ${result.error}`);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    logger.info(`[DIRECT_EMAIL] Email sent to client ${clientId} in shop ${shopId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[DIRECT_EMAIL] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
