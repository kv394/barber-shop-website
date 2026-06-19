import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-reviews-carousel
 * Replaces reviews grid rendering with fading carousel
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

    // Detect accent color
    const accentColor = (() => {
      const m = html.match(/--rose-primary:\s*([^;]+);/) || 
                html.match(/--gold-primary:\s*([^;]+);/) || 
                html.match(/--gold:\s*([^;]+);/);
      return m ? m[1].trim() : '#D4849C';
    })();

    // Find the reviews rendering block
    const renderStart = html.indexOf("getElementById('reviews-list').innerHTML");
    if (renderStart === -1) {
      return NextResponse.json({ error: 'Reviews render code not found' }, { status: 400 });
    }

    // Go back to find the start of this statement (find 'document.' before it)
    let stmtStart = renderStart;
    for (let i = renderStart - 1; i >= Math.max(0, renderStart - 50); i--) {
      if (html.substring(i, i + 8) === 'document') {
        stmtStart = i;
        break;
      }
    }

    // Find the end of the reviews block - search for testimonials display none
    const afterStart = html.substring(stmtStart);
    const testHideIdx = afterStart.indexOf("testimonials').style.display = 'none'");
    if (testHideIdx === -1) {
      return NextResponse.json({ error: 'Could not find reviews block end marker' }, { status: 400 });
    }

    // Find the closing braces after that
    let endPos = stmtStart + testHideIdx + "testimonials').style.display = 'none'".length;
    let braces = 0;
    for (let i = endPos; i < Math.min(endPos + 100, html.length); i++) {
      if (html[i] === '}') braces++;
      if (braces >= 2) { endPos = i + 1; break; }
    }

    const carouselCode = `// Reviews Carousel
              var carouselEl = document.getElementById('reviews-list');
              carouselEl.className = 'reviews-carousel';
              carouselEl.innerHTML = reviews.slice(0, 20).map(function(r, i) {
                var name = (r.user && r.user.name) || 'Client';
                var stars = '';
                for (var s = 0; s < r.rating; s++) stars += '\\u2605';
                return '<div class="reviews-carousel__slide' + (i === 0 ? ' active' : '') + '">' +
                  '<div class="reviews-carousel__stars">' + stars + '</div>' +
                  '<p class="reviews-carousel__text">\\u201C' + (r.comment || 'Great experience!') + '\\u201D</p>' +
                  '<p class="reviews-carousel__author">\\u2014 ' + name + '</p>' +
                  '</div>';
              }).join('');
              var dotsHtml = '<div class="reviews-carousel__dots">';
              for (var d = 0; d < Math.min(reviews.length, 20); d++) {
                dotsHtml += '<button class="reviews-carousel__dot' + (d === 0 ? ' active' : '') + '" data-slide="' + d + '"></button>';
              }
              dotsHtml += '</div>';
              carouselEl.insertAdjacentHTML('afterend', dotsHtml);
              var curSlide = 0;
              var allSlides = carouselEl.querySelectorAll('.reviews-carousel__slide');
              var totalSlides = allSlides.length;
              var allDots = carouselEl.parentElement.querySelectorAll('.reviews-carousel__dot');
              function showReviewSlide(idx) {
                allSlides.forEach(function(s, i) { s.classList.toggle('active', i === idx); });
                allDots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
                curSlide = idx;
              }
              allDots.forEach(function(dot) {
                dot.addEventListener('click', function() { showReviewSlide(parseInt(this.getAttribute('data-slide'))); });
              });
              setInterval(function() { showReviewSlide((curSlide + 1) % totalSlides); }, 5000);
              carouselEl.style.display = 'block';
              document.getElementById('reviews-loading').style.display = 'none';
            } else {
              document.getElementById('testimonials').style.display = 'none';
            }`;

    html = html.slice(0, stmtStart) + carouselCode + html.slice(endPos);

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: { ...customization, customHtml: html } }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Reviews carousel rendering applied',
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
