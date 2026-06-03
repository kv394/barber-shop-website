import { logger } from '@/lib/logger';
import { getPlatformSettings } from '@/lib/platform-settings';
import { prisma } from '@/lib/prisma';

// ─── Types ─────────────────────────────────────────────────────────

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// ─── Credential Resolution ─────────────────────────────────────────
// Priority: PlatformSettings table → environment variables → null

async function getTwilioCredentials(): Promise<TwilioCredentials | null> {
  try {
    const settings = await getPlatformSettings();

    const accountSid = ('twilioAccountSid' in settings ? settings.twilioAccountSid : null) || process.env.TWILIO_ACCOUNT_SID || '';
    const authToken  = ('twilioAuthToken' in settings ? settings.twilioAuthToken : null)  || process.env.TWILIO_AUTH_TOKEN  || '';
    const fromNumber = ('twilioFromNumber' in settings ? settings.twilioFromNumber : null)  || process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !fromNumber) {
      logger.warn('[SMS] Twilio credentials incomplete — SMS delivery will be skipped');
      return null;
    }

    return { accountSid, authToken, fromNumber };
  } catch (error) {
    logger.error('[SMS] Failed to load Twilio credentials from PlatformSettings', error);

    // Fall back to env vars only
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken  = process.env.TWILIO_AUTH_TOKEN  || '';
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !fromNumber) return null;
    return { accountSid, authToken, fromNumber };
  }
}

// ─── Consent & Platform Gate ───────────────────────────────────────

/**
 * Checks whether SMS is enabled at the platform level
 * (PlatformSettings.enableSms toggle).
 */
async function isSmsEnabledPlatformWide(): Promise<boolean> {
  try {
    const settings = await getPlatformSettings();
    return !!settings.enableSms;
  } catch {
    return false;
  }
}

/**
 * Checks whether the given user has opted in to receive SMS messages
 * (User.smsConsent flag).
 */
async function hasUserSmsConsent(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smsConsent: true },
    });
    return !!user?.smsConsent;
  } catch (error) {
    logger.error(`[SMS] Failed to check smsConsent for user ${userId}`, error);
    return false;
  }
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Send an SMS message via Twilio.
 *
 * Before sending, this function verifies:
 * 1. SMS is enabled at the platform level (PlatformSettings.enableSms).
 * 2. The target user has granted SMS consent (User.smsConsent).
 * 3. Valid Twilio credentials are available (DB → env fallback).
 *
 * @param to      - The recipient phone number in E.164 format (e.g. "+15551234567")
 * @param body    - The message body (max 1600 chars for Twilio)
 * @param userId  - The User ID, used to check smsConsent
 * @returns       - Result object with success/error info
 */
export async function sendSms(
  to: string,
  body: string,
  userId?: string,
): Promise<SmsResult> {
  // 1. Platform-level gate
  const platformEnabled = await isSmsEnabledPlatformWide();
  if (!platformEnabled) {
    logger.info('[SMS] SMS is disabled at the platform level — skipping');
    return { success: false, error: 'SMS disabled at platform level' };
  }

  // 2. User consent gate (when userId is provided)
  if (userId) {
    const consented = await hasUserSmsConsent(userId);
    if (!consented) {
      logger.info(`[SMS] User ${userId} has not given SMS consent — skipping`);
      return { success: false, error: 'User has not consented to SMS' };
    }
  }

  // 3. Resolve Twilio credentials
  const creds = await getTwilioCredentials();
  if (!creds) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  // 4. Send via Twilio REST API
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization':
          'Basic ' + Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: creds.fromNumber,
        Body: body,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.message || `HTTP ${res.status}`;
      logger.error(`[SMS] Twilio API error sending to ${to}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    logger.info(`[SMS] Sent to ${to} — SID: ${data.sid}`);
    return { success: true, messageId: data.sid };
  } catch (error: any) {
    logger.error(`[SMS] Failed to send SMS to ${to}`, error);
    return { success: false, error: error.message };
  }
}
