import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-duplicate-shop
 * 
 * Copies customHtml from the configured shop to its duplicate so the
 * slug resolver picks up the correct template regardless of match order.
 */
export async function POST(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { sourceShopId, targetShopId } = body;

    if (!sourceShopId || !targetShopId) {
      return NextResponse.json({ error: 'sourceShopId and targetShopId required' }, { status: 400 });
    }

    // Get source shop data
    const source = await prisma.shop.findUnique({
      where: { id: sourceShopId },
      select: { template: true, customization: true }
    });

    if (!source) {
      return NextResponse.json({ error: 'Source shop not found' }, { status: 404 });
    }

    const sourceCustom = source.customization as any;

    // Get target shop current data
    const target = await prisma.shop.findUnique({
      where: { id: targetShopId },
      select: { template: true, customization: true }
    });

    if (!target) {
      return NextResponse.json({ error: 'Target shop not found' }, { status: 404 });
    }

    const targetCustom = (target.customization || {}) as any;

    // Update target with source's template and customHtml
    const updated = await prisma.shop.update({
      where: { id: targetShopId },
      data: {
        template: source.template,
        customization: {
          ...targetCustom,
          customHtml: sourceCustom?.customHtml || ''
        }
      },
      select: { id: true, name: true, template: true }
    });

    return NextResponse.json({
      success: true,
      updated: updated,
      customHtmlLength: sourceCustom?.customHtml?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
