import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * GET /api/debug/shop-template?slug=heritage-haircuts
 * 
 * Debug endpoint to check the template state of a shop directly from DB
 * (bypassing all caches) and verify what the page rendering pipeline sees.
 */
export async function GET(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || 'heritage-haircuts';

  // 1. Direct DB query (no cache)
  const firstWord = slug.split('-').find((w: string) => w.length > 2) || slug.split('-')[0];
  const candidates = await prisma.shop.findMany({
    where: { name: { contains: firstWord, mode: 'insensitive' } },
    select: { id: true, name: true, template: true, customization: true },
    take: 10,
  });

  const matched = candidates.find(
    (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
  );

  // 2. Check Redis cache
  const envPrefix = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  let cachedTemplate = null;
  let cachedCustomHtmlLen = 0;
  try {
    const cached = await cacheService.getOrSet(
      `__debug_noop_${Date.now()}`, // unique key to avoid collision
      async () => null,
      1
    );
    // Try reading the actual cached shop data
    // We can't easily read without the getOrSet, so just report env info
  } catch (e) {}

  const result = {
    slug,
    envPrefix,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    matchedShop: matched ? {
      id: matched.id,
      name: matched.name,
      template: matched.template,
      customHtmlLength: (matched.customization as any)?.customHtml?.length || 0,
      customHtmlPreview: (matched.customization as any)?.customHtml?.substring(0, 100) || 'EMPTY',
    } : 'NOT FOUND',
    allCandidates: candidates.map((s: any) => ({
      id: s.id,
      name: s.name,
      template: s.template,
      customHtmlLength: s.customization?.customHtml?.length || 0,
    })),
  };

  return NextResponse.json(result, { status: 200 });
}
