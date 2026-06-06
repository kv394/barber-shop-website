import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/fix-syntax
 * Fixes the broken JS syntax in the reviews section
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';
    const changes: string[] = [];

    // Fix: "} else { ... } catch" -> "} else { ... } } catch"
    const broken = `} else {
              document.getElementById('testimonials').style.display = 'none';
            } catch(e)`;
    const fixed = `} else {
              document.getElementById('testimonials').style.display = 'none';
            }
          } catch(e)`;

    if (html.includes(broken)) {
      html = html.replace(broken, fixed);
      changes.push('Fixed missing closing brace before catch in reviews block');
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No syntax issues found' });
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: { ...customization, customHtml: html } }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({ success: true, changes, html_length: html.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
