import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { decryptSmtpPassword } from '@/lib/smtp-crypto';
import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/shops/[shopId]/smtp/test
 * Send a test email using the shop's configured SMTP.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (isAuthError(authResult)) return authResult;

  try {
    // Get the calling user's email for the test
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const testRecipient = authUser?.email;
    if (!testRecipient) {
      return NextResponse.json({ error: 'Could not determine your email address' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, customization: true },
    });

    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const customization = (shop.customization as Record<string, any>) || {};
    const smtpConfig = customization.smtp;

    if (!smtpConfig?.host || !smtpConfig?.username || !smtpConfig?.password) {
      return NextResponse.json({ error: 'SMTP is not configured. Please save your SMTP settings first.' }, { status: 400 });
    }

    // Decrypt and send test email
    const decryptedPassword = decryptSmtpPassword(smtpConfig.password);

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port || 587,
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.username,
        pass: decryptedPassword,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
    });

    const fromAddress = smtpConfig.fromName
      ? `${smtpConfig.fromName} <${smtpConfig.fromEmail || smtpConfig.username}>`
      : smtpConfig.fromEmail || smtpConfig.username;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: testRecipient,
      subject: `✅ SMTP Test — ${shop.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: #1a1a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px 32px; color: #fff;">
            <h1 style="margin: 0 0 16px 0; font-size: 22px;">✅ SMTP Test Successful</h1>
            <p style="color: #9898a8; font-size: 14px; line-height: 1.6;">
              This email was sent via your custom SMTP configuration for <strong style="color: #fff;">${shop.name}</strong>.
            </p>
            <div style="background: #12121a; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #9898a8;">
              <strong style="color: #7c5cfc;">Server:</strong> ${smtpConfig.host}:${smtpConfig.port}<br/>
              <strong style="color: #7c5cfc;">From:</strong> ${fromAddress}<br/>
              <strong style="color: #7c5cfc;">Time:</strong> ${new Date().toISOString()}
            </div>
            <p style="color: #5a5a6e; font-size: 12px;">All future notifications for your shop will be sent from this address.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testRecipient}`,
      messageId: info.messageId,
    });
  } catch (error: any) {
    logger.error('SMTP test failed:', error);

    // Provide user-friendly error messages
    let userMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      userMessage = 'Connection refused. Check the host and port.';
    } else if (error.code === 'EAUTH' || error.responseCode === 535) {
      userMessage = 'Authentication failed. Check your username and password.';
    } else if (error.code === 'ESOCKET') {
      userMessage = 'Connection timed out. The server may be unreachable.';
    } else if (error.code === 'ECONNECTION') {
      userMessage = 'Could not connect to the SMTP server. Verify the host and TLS setting.';
    }

    return NextResponse.json({ error: `SMTP test failed: ${userMessage}` }, { status: 400 });
  }
}
