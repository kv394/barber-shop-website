import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

const MAX_BODY_SIZE = 10 * 1024; // 10KB
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Enforce body size limit
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = JSON.parse(rawBody);

    // Require message field
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 });
    }

    logger.error('Client-side error reported:', body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
