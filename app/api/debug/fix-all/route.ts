import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-all
 * Fixes products section styling, review form background to match Heritage Haircuts theme
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

    // 1. Fix products section class and structure to match services/team pattern
    if (html.includes('class="section" id="products"')) {
      html = html.replace('class="section" id="products"', 'class="services" id="products"');
      changes.push('Fixed products section class to "services"');
    }

    // Replace the products header to match services header
    const oldHeader = `<div class="section__header">
        <h2 class="section__heading reveal">Our <span style="color:#e9c176" class="italic">Premium Products</span></h2>
      </div>`;
    if (html.includes(oldHeader)) {
      html = html.replace(oldHeader, `<div class="services__header">
        <div class="section-label reveal">OUR COLLECTION</div>
        <h2 class="services__heading reveal">Premium <span style="color:#e9c176" class="italic">Products</span></h2>
      </div>`);
      changes.push('Updated products header to match services style');
    }

    // 2. Replace all review form CSS with theme-matched version
    // Remove old review form CSS block
    const reviewCssPatterns = [
      /\/\* Review Form \*\/[^]*?\.review-form__msg--error\s*\{[^}]*\}/,
    ];
    
    // Build new review form CSS matching the Heritage theme
    const newReviewCss = `/* Review Form */
    .review-form-section {
      padding: 120px 0;
      background: var(--bg-darkest);
      position: relative;
    }
    .review-form {
      max-width: 600px;
      margin: 0 auto;
      padding: 48px;
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid rgba(233,193,118,0.12);
    }
    .review-form h3 {
      font-family: var(--font-serif);
      font-size: clamp(1.4rem, 2.5vw, 1.8rem);
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
      text-align: center;
      line-height: 1.2;
    }
    .review-form__subtitle {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 24px;
    }
    .review-form__stars {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 20px;
    }
    .review-form__star {
      font-size: 2.2rem;
      cursor: pointer;
      color: rgba(255,255,255,0.15);
      transition: color 0.2s, transform 0.2s;
      user-select: none;
    }
    .review-form__star:hover, .review-form__star.active {
      color: var(--gold-primary);
      transform: scale(1.15);
    }
    .review-form textarea {
      width: 100%;
      min-height: 120px;
      padding: 16px;
      background: var(--bg-main);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      resize: vertical;
      transition: border-color 0.3s;
    }
    .review-form textarea:focus {
      outline: none;
      border-color: var(--gold-primary);
    }
    .review-form textarea::placeholder { color: var(--text-muted); }
    .review-form__submit {
      display: block;
      width: 100%;
      margin-top: 20px;
      padding: 16px;
      background: var(--gold-gradient);
      color: var(--bg-darkest);
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .review-form__submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(233,193,118,0.25); }
    .review-form__submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
    .review-form__msg { text-align: center; margin-top: 14px; font-size: 0.9rem; font-family: var(--font-sans); }
    .review-form__msg--success { color: #4ade80; }
    .review-form__msg--error { color: #f87171; }`;

    // Find and replace old review CSS
    const oldCssStart = html.indexOf('/* Review Form */');
    if (oldCssStart > -1) {
      const oldCssEnd = html.indexOf('.review-form__msg--error', oldCssStart);
      if (oldCssEnd > -1) {
        // Find the closing } after --error
        let endPos = html.indexOf('}', oldCssEnd);
        if (endPos > -1) {
          html = html.slice(0, oldCssStart) + newReviewCss + html.slice(endPos + 1);
          changes.push('Replaced review form CSS with theme-matched version');
        }
      }
    }

    // 3. Update review form HTML to add subtitle and better structure
    const oldFormHtml = `<h3>Share Your Experience</h3>`;
    if (html.includes(oldFormHtml)) {
      html = html.replace(
        oldFormHtml,
        `<h3>Share Your <span style="color:#e9c176" class="italic">Experience</span></h3>
        <p class="review-form__subtitle">We value your feedback</p>`
      );
      changes.push('Updated review form heading to match theme');
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed', html_length: html.length });
    }

    // Save
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        customization: {
          ...customization,
          customHtml: html
        }
      }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      changes,
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
