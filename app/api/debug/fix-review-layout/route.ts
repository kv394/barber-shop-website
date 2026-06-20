import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-review-layout
 * Puts "Client Love" reviews carousel and "Share Your Experience" form side by side
 */
export async function POST(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

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

    // 1. Add side-by-side layout CSS
    if (!html.includes('reviews-row')) {
      const layoutCss = `
    /* Reviews + Form Side by Side */
    .reviews-row { display: flex; gap: 40px; align-items: flex-start; max-width: 1200px; margin: 0 auto; }
    .reviews-row__left { flex: 1; min-width: 0; }
    .reviews-row__right { flex: 1; min-width: 0; }
    .review-form-section { padding: 0; background: transparent; }
    .review-form-section .container { padding: 0; }
    @media (max-width: 768px) {
      .reviews-row { flex-direction: column; gap: 30px; }
    }`;

      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + layoutCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added side-by-side layout CSS');
      }
    }

    // 2. Move the review form section into the testimonials section
    // Extract the review form section HTML
    const formSectionStart = html.indexOf('<div class="review-form-section">');
    if (formSectionStart === -1) {
      return NextResponse.json({ error: 'Review form section not found' }, { status: 400 });
    }

    // Find the end of the review form section
    // It ends with </div>\n  </div>\n  </div> (closing review-form, container, review-form-section)
    let formSectionEnd = formSectionStart;
    let divDepth = 0;
    for (let i = formSectionStart; i < html.length; i++) {
      if (html.substring(i, i + 4) === '<div') divDepth++;
      if (html.substring(i, i + 6) === '</div>') {
        divDepth--;
        if (divDepth === 0) {
          formSectionEnd = i + 6;
          break;
        }
      }
    }

    const formHtml = html.substring(formSectionStart, formSectionEnd);
    
    // Remove the standalone form section
    html = html.slice(0, formSectionStart) + html.slice(formSectionEnd);
    changes.push('Removed standalone review form section');

    // 3. Find the testimonials container and wrap contents in a row
    // Find the <div class="container"> inside testimonials section
    const testimonialsStart = html.indexOf('id="testimonials"');
    if (testimonialsStart === -1) {
      return NextResponse.json({ error: 'Testimonials section not found' }, { status: 400 });
    }

    // Find the container div after testimonials
    const containerStart = html.indexOf('<div class="container">', testimonialsStart);
    if (containerStart === -1) {
      return NextResponse.json({ error: 'Container inside testimonials not found' }, { status: 400 });
    }
    const containerContentStart = containerStart + '<div class="container">'.length;

    // Find the closing </div> of the container (before </section>)
    const sectionClose = html.indexOf('</section>', testimonialsStart);
    // The container closes just before </section>
    // Find the last </div> before </section>
    let containerEnd = sectionClose;
    // Go backwards from </section> to find </div>
    const beforeSection = html.substring(containerContentStart, sectionClose);
    const lastDivClose = beforeSection.lastIndexOf('</div>');
    containerEnd = containerContentStart + lastDivClose;

    // Get existing testimonials content (heading + reviews)
    const testimonialsContent = html.substring(containerContentStart, containerEnd);

    // Build the new layout: heading on top, then row with carousel + form
    // Find the heading part (everything before reviews-loading or reviews-list)
    const headingEnd = testimonialsContent.indexOf('<div id="reviews-loading"');
    const headingPart = headingEnd > -1 ? testimonialsContent.substring(0, headingEnd) : '';
    const reviewsPart = headingEnd > -1 ? testimonialsContent.substring(headingEnd) : testimonialsContent;

    const newContent = `${headingPart}
      <div class="reviews-row">
        <div class="reviews-row__left">
          ${reviewsPart}
        </div>
        <div class="reviews-row__right">
          ${formHtml}
        </div>
      </div>`;

    html = html.slice(0, containerContentStart) + newContent + html.slice(containerEnd);
    changes.push('Wrapped reviews carousel and form in side-by-side row');

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed' });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
