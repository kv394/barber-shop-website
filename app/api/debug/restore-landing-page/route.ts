import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * POST /api/debug/restore-landing-page
 * Reads a landing page HTML file from public/html-sections/ and writes it
 * to the shop's customization.customHtml in the database.
 * 
 * Body: { shopId: string, template: "luxury-nails" | "heritage-haircuts" | "index" | "SportClips" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, template } = body;

    if (!shopId || !template) {
      return NextResponse.json(
        { error: 'shopId and template are required' },
        { status: 400 }
      );
    }

    // Validate template name to prevent path traversal
    const allowedTemplates = ['luxury-nails', 'heritage-haircuts', 'index', 'SportClips'];
    if (!allowedTemplates.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Allowed: ${allowedTemplates.join(', ')}` },
        { status: 400 }
      );
    }

    // Read the HTML file
    const filePath = join(process.cwd(), 'public', 'html-sections', `${template}.html`);
    let html: string;
    try {
      html = readFileSync(filePath, 'utf-8');
    } catch (e) {
      return NextResponse.json(
        { error: `File not found: ${template}.html` },
        { status: 404 }
      );
    }

    // Look up the shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true, template: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;

    // Update the shop with the HTML and ensure template is 'custom'
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        template: 'custom',
        customization: {
          ...customization,
          customHtml: html
        }
      }
    });

    // Invalidate caches
    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      shopId,
      template,
      shopName: shop.name,
      htmlLength: html.length,
      message: `Restored ${template}.html to shop "${shop.name}" (${shopId})`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
