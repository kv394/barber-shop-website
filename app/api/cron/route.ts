import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { LoyaltyService } from '@/lib/loyalty';
import { UsageService } from '@/lib/usage-service';
import { RebookingService } from '@/lib/rebooking-prompts';
import { logger } from '@/lib/logger';
import { getProviderStatus } from '@/lib/messaging-providers';
import { timingSafeEqual } from 'crypto';

/** Timing-safe string comparison to prevent timing attacks on secret values */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Cron endpoint — Processes scheduled notifications, retries, and point expiry.
 *
 * Supports multiple invocation methods:
 * 1. Vercel Cron: Set schedule in vercel.json, uses CRON_SECRET header/param
 * 2. QStash: Verifies Upstash-Signature header for webhook authenticity
 * 3. External: Any HTTP GET with ?secret=YOUR_CRON_SECRET
 * 4. Self-heal: Can be called from app startup interval (see instrumentation.ts)
 */
export async function GET(request: Request) {
  try {
    // ── Auth: support multiple verification methods ──
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const headers = Object.fromEntries(request.headers.entries());

    // Method 1: Vercel Cron sends secret via header or param
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      // SECURITY: If CRON_SECRET is not configured, block all access
      return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
    }
    const headerSecret = headers['authorization']?.replace('Bearer ', '');
    const secretMatch = (secret && safeCompare(secret, cronSecret)) ||
                        (headerSecret && safeCompare(headerSecret, cronSecret));
    if (!secretMatch) {
      // Check QStash as fallback before rejecting
      const qstashSignature = headers['upstash-signature'];
      if (qstashSignature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
        const isValid = await verifyQStashSignature(
          qstashSignature,
          request.url,
          process.env.QSTASH_CURRENT_SIGNING_KEY
        );
        if (!isValid) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // ── Execute scheduled tasks ──
    const startTime = Date.now();

    // 1. Process pending + retry failed notifications
    const notificationsProcessed = await NotificationService.processScheduled();

    // 2. Expire old loyalty points
    const pointsExpired = await LoyaltyService.processPointExpiry();

    // 3. Generate hourly usage reports for all shops
    const usageReportsGenerated = await UsageService.generateHourlyReports();

    // 4. Process predictive rebooking prompts ("Time for a trim?")
    const rebookingPromptsQueued = await RebookingService.processAllShops();

    const duration = Date.now() - startTime;
    const providers = getProviderStatus();

    return NextResponse.json({
      success: true,
      notificationsProcessed,
      pointsExpired,
      usageReportsGenerated,
      rebookingPromptsQueued,
      durationMs: duration,
      providers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

// Also support POST for QStash webhook delivery
export async function POST(request: Request) {
  return GET(request);
}

/**
 * Verify QStash webhook signature (HMAC-SHA256)
 * See: https://docs.upstash.com/qstash/howto/signature
 */
async function verifyQStashSignature(
  signature: string,
  url: string,
  signingKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signingKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(url));
  } catch {
    return false;
  }
}
