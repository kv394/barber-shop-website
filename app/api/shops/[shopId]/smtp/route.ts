import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { encryptSmtpPassword, decryptSmtpPassword, validateSmtpConfig } from '@/lib/smtp-crypto';
import { logger } from '@/lib/logger';

/**
 * GET /api/shops/[shopId]/smtp
 * Returns the shop's SMTP config with password masked.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });

    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const customization = (shop.customization as Record<string, any>) || {};
    const smtp = customization.smtp;

    if (!smtp) {
      return NextResponse.json({ configured: false, smtp: null });
    }

    // Return config with password masked
    return NextResponse.json({
      configured: true,
      smtp: {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        username: smtp.username,
        password: '••••••••', // Never expose the encrypted password
        fromEmail: smtp.fromEmail,
        fromName: smtp.fromName || '',
      },
    });
  } catch (error: any) {
    logger.error('Error fetching SMTP config:', error);
    return NextResponse.json({ error: 'Failed to fetch SMTP configuration' }, { status: 500 });
  }
}

/**
 * PUT /api/shops/[shopId]/smtp
 * Save or update the shop's SMTP configuration.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });

    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const body = await request.json();
    const { host, port, secure, username, password, fromEmail, fromName } = body;

    // Validate
    const validation = validateSmtpConfig({ host, port: Number(port), secure, username, password, fromEmail });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Encrypt the password
    const encryptedPassword = encryptSmtpPassword(password);

    // Merge into existing customization
    const customization = (shop.customization as Record<string, any>) || {};
    customization.smtp = {
      host: host.trim(),
      port: Number(port),
      secure: Boolean(secure),
      username: username.trim(),
      password: encryptedPassword,
      fromEmail: fromEmail.trim().toLowerCase(),
      fromName: (fromName || '').trim(),
    };

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization },
    });

    return NextResponse.json({ success: true, message: 'SMTP configuration saved' });
  } catch (error: any) {
    logger.error('Error saving SMTP config:', error);
    return NextResponse.json({ error: 'Failed to save SMTP configuration' }, { status: 500 });
  }
}

/**
 * DELETE /api/shops/[shopId]/smtp
 * Remove the shop's SMTP configuration (reverts to site-level email).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });

    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const customization = (shop.customization as Record<string, any>) || {};
    delete customization.smtp;

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization },
    });

    return NextResponse.json({ success: true, message: 'SMTP configuration removed. Emails will use the default provider.' });
  } catch (error: any) {
    logger.error('Error removing SMTP config:', error);
    return NextResponse.json({ error: 'Failed to remove SMTP configuration' }, { status: 500 });
  }
}
