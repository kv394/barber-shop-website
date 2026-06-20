import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/cache/invalidate
 * 
 * Invalidates shop page cache by slug. Protected by a simple secret.
 * 
 * Body: { slug: string, secret: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, secret } = body;

    // Simple protection — require CRON_SECRET or INNGEST_SIGNING_KEY
    const expectedSecret = process.env.CRON_SECRET || process.env.INNGEST_SIGNING_KEY;
    if (!expectedSecret) {
      return NextResponse.json({ error: 'Cache invalidation secret not configured' }, { status: 500 });
    }
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Invalidate all possible env-prefixed cache keys
    await cacheService.invalidate(`shop_public_page_data:${slug}`);
    
    // Also try pattern-based invalidation
    await cacheService.invalidatePattern(`*:shop_public_page_data:${slug}`);
    await cacheService.invalidatePattern(`shop_public_page_data:${slug}`);

    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for slug: ${slug}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
