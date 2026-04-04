import { logger } from '@/lib/logger';

// ─── Provider Interface ────────────────────────────────────────────
// Every email/SMS provider implements this contract.
// Add new providers by implementing the interface and registering in the factory.

export interface EmailProvider {
  name: string;
  send(to: string, subject: string, body: string, html?: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
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
    this.from = process.env.EMAIL_FROM || 'BarberSaaS <noreply@barbersaas.com>';
  }

  async send(to: string, subject: string, body: string, html?: string) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject,
          ...(html ? { html } : { text: body }),
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || `HTTP ${res.status}` };
      return { success: true, messageId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
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
    this.from = process.env.EMAIL_FROM || 'noreply@barbersaas.com';
  }

  async send(to: string, subject: string, body: string, html?: string) {
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
          from: { email: this.from },
          subject,
          content,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }
      return { success: true, messageId: res.headers.get('x-message-id') || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
    }
  }
}

// ─── Console Fallback Providers (dev/testing) ──────────────────────

class ConsoleEmailProvider implements EmailProvider {
  name = 'console';
  async send(to: string, subject: string, body: string) {
    console.log(`[EMAIL:console] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 120)}...`);
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

export function getSMSProvider(): SMSProvider {
  const explicit = process.env.SMS_PROVIDER?.toLowerCase();

  if (explicit === 'twilio' && process.env.TWILIO_ACCOUNT_SID) return new TwilioProvider();

  // Auto-detect
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return new TwilioProvider();

  return new ConsoleSMSProvider();
}

// ─── Provider Status Utility ───────────────────────────────────────

export function getProviderStatus() {
  const email = getEmailProvider();
  const sms = getSMSProvider();
  return {
    email: { provider: email.name, configured: email.name !== 'console' },
    sms: { provider: sms.name, configured: sms.name !== 'console' },
  };
}

