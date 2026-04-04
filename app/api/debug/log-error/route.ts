import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Require authentication to prevent log injection / DoS
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, errorMsg, stack, url, shopId } = body;

    // Sanitize inputs — truncate to prevent log flooding
    const safeMessage = String(message || 'Frontend UI Error').slice(0, 500);
    const safeError = String(errorMsg || '').slice(0, 1000);
    const safeStack = String(stack || '').slice(0, 2000);

    await logger.error(safeMessage, {
      message: safeError,
      stack: safeStack,
    }, {
      shopId: shopId ? String(shopId).slice(0, 50) : undefined,
      path: url ? String(url).slice(0, 200) : undefined,
      userId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to log error telemetry', err);
    return NextResponse.json({ error: 'Failed logging telemetry' }, { status: 500 });
  }
}
