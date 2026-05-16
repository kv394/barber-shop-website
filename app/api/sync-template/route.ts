import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const htmlPath = path.join(process.cwd(), 'public', 'html-sections', 'SportClips.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    const shop = await prisma.shop.findUnique({ where: { id: 'cmn9kj24n0000lqzc7kcsmpst' } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' });
    
    const custom = (shop.customization as any) || {};
    custom.customHtml = html;
    
    await prisma.shop.update({
      where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
      data: { customization: custom }
    });
    
    // Also clear cache
    const { cacheService } = await import('@/lib/cache');
    await cacheService.invalidatePattern(`shop_public_page_data:*`);
    await cacheService.invalidate(`shop_public_page_data:cmn9kj24n0000lqzc7kcsmpst`);
    
    return NextResponse.json({ success: true, htmlLength: html.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
