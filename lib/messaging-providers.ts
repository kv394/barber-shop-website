import { logger } from '@/lib/logger';

// ─── Provider Interface ────────────────────────────────────────────
// Every email/SMS provider implements this contract.
// Add new providers by implementing the interface and registering in the factory.

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string
  type?: string;
}

export interface EmailProvider {
  name: string;
  send(to: string, subject: string, body: string, html?: string, attachments?: EmailAttachment[], fromName?: string, replyTo?: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SMSProvider {
  name: string;
  send(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ─── Resend Email Provider ─────────────────────────────────────────

class ResendProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.from = process.env.EMAIL_FROM || 'Kutz <noreply@kutzapp.com>';
  }

  async send(to: string, subject: string, body: string, html?: string, attachments?: EmailAttachment[], fromName?: string, replyTo?: string) {
    try {
      const from = fromName ? `${fromName} <${this.from.replace(/^.*</, '').replace(/>$/, '')}>` : this.from;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          ...(replyTo ? { reply_to: replyTo } : {}),
          ...(html ? { html } : { text: body }),
          ...(attachments ? { attachments: attachments.map(a => ({ filename: a.filename, content: a.content })) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
      return { success: true, messageId: data.id };
    } catch (error: any) {
      return { success: false, error: 'Message delivery failed' };
    }
  }
}

// ─── SendGrid Email Provider ───────────────────────────────────────

class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.from = process.env.EMAIL_FROM || 'noreply@kutzapp.com';
  }

  async send(to: string, subject: string, body: string, html?: string, attachments?: EmailAttachment[], fromName?: string, replyTo?: string) {
    try {
      const content = html
        ? [{ type: 'text/html', value: html }]
        : [{ type: 'text/plain', value: body }];

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.from, ...(fromName ? { name: fromName } : {}) },
          ...(replyTo ? { reply_to: { email: replyTo } } : {}),
          subject,
          content,
          ...(attachments ? { attachments: attachments.map(a => ({ filename: a.filename, content: a.content, type: a.type || 'application/octet-stream', disposition: 'attachment' })) } : {}),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }
      return { success: true, messageId: res.headers.get('x-message-id') || undefined };
    } catch (error: any) {
      return { success: false, error: 'Message delivery failed' };
    }
  }
}

// ─── Twilio SMS Provider ───────────────────────────────────────────

class TwilioProvider implements SMSProvider {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private from: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.from = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async send(to: string, body: string) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: this.from, Body: body }),
        }
      );
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
      return { success: true, messageId: data.sid };
    } catch (error: any) {
      return { success: false, error: 'Message delivery failed' };
    }
  }
}

// ─── Twilio WhatsApp Provider ─────────────────────────────────────
// Uses the same Twilio Messages API but with whatsapp: prefix on From/To.
// Requires TWILIO_WHATSAPP_NUMBER env var (e.g. "whatsapp:+14155238886")

class TwilioWhatsAppProvider implements SMSProvider {
  name = 'twilio-whatsapp';
  private accountSid: string;
  private authToken: string;
  private from: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    // WhatsApp sender must be in format "whatsapp:+1234567890"
    this.from = process.env.TWILIO_WHATSAPP_NUMBER || '';
  }

  async send(to: string, body: string) {
    try {
      // Ensure the recipient number has whatsapp: prefix
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: whatsappTo, From: this.from, Body: body }),
        }
      );
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
      return { success: true, messageId: data.sid };
    } catch (error: any) {
      return { success: false, error: 'Message delivery failed' };
    }
  }
}

// ─── Console Fallback Providers (dev/testing) ──────────────────────

class ConsoleEmailProvider implements EmailProvider {
  name = 'console';
  async send(to: string, subject: string, body: string, html?: string, attachments?: EmailAttachment[]) {
    console.log(`[EMAIL:console] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 120)}... | Attachments: ${attachments?.length || 0}`);
    return { success: true, messageId: `console_${Date.now()}` };
  }
}

class ConsoleSMSProvider implements SMSProvider {
  name = 'console';
  async send(to: string, body: string) {
    console.log(`[SMS:console] To: ${to} | Body: ${body.substring(0, 120)}...`);
    return { success: true, messageId: `console_${Date.now()}` };
  }
}

// ─── SMTP Email Provider (per-shop custom SMTP) ────────────────────

class SmtpProvider implements EmailProvider {
  name = 'smtp';
  private host: string;
  private port: number;
  private secure: boolean;
  private username: string;
  private password: string;
  private from: string;

  constructor(config: { host: string; port: number; secure: boolean; username: string; password: string; fromEmail: string; fromName?: string }) {
    this.host = config.host;
    this.port = config.port;
    this.secure = config.secure;
    this.username = config.username;
    this.password = config.password;
    this.from = config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail;
  }

  async send(to: string, subject: string, body: string, html?: string, attachments?: EmailAttachment[], fromName?: string, replyTo?: string) {
    try {
      // Use nodemailer for SMTP transport
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.username,
          pass: this.password,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
      });

      const mailOptions: any = {
        from: this.from,
        to,
        subject,
        ...(replyTo ? { replyTo } : {}),
        ...(html ? { html } : { text: body }),
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64'),
          contentType: a.type,
        }));
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error(`[SMTP] Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: 'Message delivery failed' };
    }
  }
}

// ─── Provider Factory ──────────────────────────────────────────────
// Reads env vars to decide which provider to instantiate.
// Priority: explicit EMAIL_PROVIDER/SMS_PROVIDER env → auto-detect from API keys → console fallback

export function getEmailProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (explicit === 'resend' && process.env.RESEND_API_KEY) return new ResendProvider();
  if (explicit === 'sendgrid' && process.env.SENDGRID_API_KEY) return new SendGridProvider();

  // Auto-detect: Resend is cheaper, prefer it if key exists
  if (process.env.RESEND_API_KEY) return new ResendProvider();
  if (process.env.SENDGRID_API_KEY) return new SendGridProvider();

  return new ConsoleEmailProvider();
}

/**
 * Get the email provider for a specific shop.
 * 
 * Priority:
 * 1. Custom SMTP (free, always available) — if the shop has SMTP configured, use it
 * 2. Platform email (premium) — if the shop has the 'platformEmail' feature, use Resend/SendGrid
 * 3. Console fallback — log only, no email sent
 */
export async function getEmailProviderForShop(shopId: string): Promise<EmailProvider> {
  if (!shopId) return getEmailProvider();

  try {
    const { prisma } = await import('@/lib/prisma');
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, premiumFeatures: true },
    });

    if (!shop) return getEmailProvider();

    // 1. Check for custom SMTP (free for all shops)
    const customization = (shop.customization as Record<string, any>) || {};
    const smtpConfig = customization.smtp;

    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      const { decryptSmtpPassword } = await import('@/lib/smtp-crypto');
      const decryptedPassword = decryptSmtpPassword(smtpConfig.password);

      return new SmtpProvider({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        username: smtpConfig.username,
        password: decryptedPassword,
        fromEmail: smtpConfig.fromEmail || smtpConfig.username,
        fromName: smtpConfig.fromName,
      });
    }

    // 2. Check for platform email premium feature (uses kutzapp.com / Resend)
    const premiumFeatures = (shop.premiumFeatures as Record<string, boolean>) || {};
    if (premiumFeatures.platformEmail) {
      return getEmailProvider(); // Resend / SendGrid / site-level
    }

    // 3. Fall back to platform-level email provider (Resend/SendGrid) if available
    const platformProvider = getEmailProvider();
    if (platformProvider.name !== 'console') {
      return platformProvider;
    }

    // 4. No email provider available — log only
    logger.warn(`[EMAIL] Shop ${shopId} has no custom SMTP and no platform email keys configured. Email will be logged only.`);
    return new ConsoleEmailProvider();
  } catch (error: any) {
    logger.error(`[SMTP] Failed to load shop email config for ${shopId}: ${error.message}`);
    return getEmailProvider();
  }
}

export function getSMSProvider(): SMSProvider {
  const explicit = process.env.SMS_PROVIDER?.toLowerCase();

  if (explicit === 'twilio' && process.env.TWILIO_ACCOUNT_SID) return new TwilioProvider();

  // Auto-detect
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return new TwilioProvider();

  return new ConsoleSMSProvider();
}

export function getWhatsAppProvider(): SMSProvider {
  // WhatsApp requires both Twilio credentials AND a WhatsApp sender number
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
    return new TwilioWhatsAppProvider();
  }
  return new ConsoleSMSProvider();
}

// ─── Provider Status Utility ───────────────────────────────────────

export function getProviderStatus() {
  const email = getEmailProvider();
  const sms = getSMSProvider();
  const whatsapp = getWhatsAppProvider();
  return {
    email: { provider: email.name, configured: email.name !== 'console' },
    sms: { provider: sms.name, configured: sms.name !== 'console' },
    whatsapp: { provider: whatsapp.name, configured: whatsapp.name !== 'console' },
  };
}

