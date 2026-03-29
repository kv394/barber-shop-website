import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, errorMsg, stack, url, shopId } = body;

    // Utilize our logger utility to push alert
    await logger.error(message || 'Frontend UI Error Caught', {
      message: errorMsg,
      stack: stack
    }, {
      shopId: shopId,
      path: url
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to log error telemetry', err);
    return NextResponse.json({ error: 'Failed logging telemetry' }, { status: 500 });
  }
}
