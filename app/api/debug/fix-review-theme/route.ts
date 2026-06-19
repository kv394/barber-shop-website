import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-review-theme
 * Replaces review form CSS + makes reviews a fading carousel
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

    // Detect theme
    const bgMainMatch = html.match(/--bg-main:\s*([^;]+);/);
    const bgMain = bgMainMatch ? bgMainMatch[1].trim() : '#131313';
    const isLight = /^#[C-Fc-f]/.test(bgMain);

    // Safe variable getter - tries multiple variable names
    const getVar = (names: string[], fallback: string): string => {
      for (const name of names) {
        const m = html.match(new RegExp(name + ':\\s*([^;]+);'));
        if (m) return m[1].trim();
      }
      return fallback;
    };

    let sectionBg: string, cardBg: string, textColor: string, textMuted: string, 
        borderColor: string, inputBg: string, accentColor: string, 
        fontHeading: string, fontBody: string, submitText: string, 
        starInactive: string, hoverShadow: string;

    if (isLight) {
      sectionBg = getVar(['--bg-cream', '--bg-lightest', '--bg-blush'], '#FAF5F3');
      cardBg = '#FFFFFF';
      textColor = getVar(['--text-heading'], '#2D2428');
      textMuted = getVar(['--text-muted'], '#8B7580');
      borderColor = 'rgba(45,36,40,0.1)';
      inputBg = getVar(['--bg-lightest', '--bg-main'], '#FFF9F7');
      accentColor = getVar(['--rose-primary', '--gold', '--primary'], '#D4849C');
      fontHeading = getVar(['--font-heading'], "'Playfair Display', Georgia, serif");
      fontBody = getVar(['--font-body'], "'Lato', sans-serif");
      submitText = '#FFFFFF';
      starInactive = 'rgba(45,36,40,0.15)';
      hoverShadow = accentColor + '30';
    } else {
      sectionBg = getVar(['--bg-darkest', '--bg-main'], '#0e0e0e');
      cardBg = getVar(['--bg-card', '--bg-section'], '#252525');
      textColor = '#FFFFFF';
      textMuted = getVar(['--text-muted'], 'rgba(255,255,255,0.5)');
      borderColor = 'rgba(255,255,255,0.08)';
      inputBg = getVar(['--bg-main'], 'rgba(0,0,0,0.3)');
      accentColor = getVar(['--gold-primary', '--gold', '--primary'], '#e9c176');
      fontHeading = getVar(['--font-serif', '--font-heading'], 'Georgia, serif');
      fontBody = getVar(['--font-sans', '--font-body'], 'sans-serif');
      submitText = '#000000';
      starInactive = 'rgba(255,255,255,0.15)';
      hoverShadow = accentColor + '40';
    }

    // 1. Fix review form CSS
    const newFormCss = `/* Review Form */
    .review-form-section { padding: 100px 0; background: ${sectionBg}; }
    .review-form { max-width: 600px; margin: 0 auto; padding: 48px; background: ${cardBg}; border-radius: 16px; border: 1px solid ${borderColor}; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
    .review-form h3 { font-family: ${fontHeading}; font-size: clamp(1.4rem, 2.5vw, 1.8rem); font-weight: 700; color: ${textColor}; margin-bottom: 8px; text-align: center; }
    .review-form__subtitle { text-align: center; color: ${textMuted}; font-size: 0.9rem; margin-bottom: 24px; }
    .review-form__stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .review-form__star { font-size: 2.2rem; cursor: pointer; color: ${starInactive}; transition: color 0.2s, transform 0.2s; user-select: none; }
    .review-form__star:hover, .review-form__star.active { color: ${accentColor}; transform: scale(1.15); }
    .review-form textarea { width: 100%; min-height: 120px; padding: 16px; background: ${inputBg}; border: 1px solid ${borderColor}; border-radius: 8px; color: ${textColor}; font-family: ${fontBody}; font-size: 0.95rem; resize: vertical; transition: border-color 0.3s; box-sizing: border-box; }
    .review-form textarea:focus { outline: none; border-color: ${accentColor}; }
    .review-form textarea::placeholder { color: ${textMuted}; }
    .review-form__submit { display: block; width: 100%; margin-top: 20px; padding: 16px; background: ${accentColor}; color: ${submitText}; font-family: ${fontBody}; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
    .review-form__submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${hoverShadow}; }
    .review-form__submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .review-form__msg { text-align: center; margin-top: 14px; font-size: 0.9rem; font-family: ${fontBody}; }
    .review-form__msg--success { color: #16a34a; }
    .review-form__msg--error { color: #dc2626; }`;

    const oldCssStart = html.indexOf('/* Review Form */');
    if (oldCssStart > -1) {
      const oldCssEnd = html.indexOf('.review-form__msg--error', oldCssStart);
      if (oldCssEnd > -1) {
        const endPos = html.indexOf('}', oldCssEnd);
        if (endPos > -1) {
          html = html.slice(0, oldCssStart) + newFormCss + html.slice(endPos + 1);
          changes.push('Updated review form CSS to match theme');
        }
      }
    }

    // 2. Add fading carousel CSS for reviews
    if (!html.includes('reviews-carousel')) {
      const carouselCss = `
    /* Reviews Carousel */
    .reviews-carousel { position: relative; max-width: 700px; margin: 0 auto; min-height: 200px; }
    .reviews-carousel__slide { position: absolute; top: 0; left: 0; width: 100%; opacity: 0; transition: opacity 0.8s ease-in-out; pointer-events: none; padding: 40px; background: ${cardBg}; border-radius: 16px; border: 1px solid ${borderColor}; box-shadow: 0 4px 20px rgba(0,0,0,0.04); text-align: center; box-sizing: border-box; }
    .reviews-carousel__slide.active { opacity: 1; pointer-events: auto; position: relative; }
    .reviews-carousel__stars { color: ${accentColor}; font-size: 1.3rem; letter-spacing: 4px; margin-bottom: 16px; }
    .reviews-carousel__text { font-family: ${fontHeading}; font-size: 1.15rem; font-style: italic; color: ${textColor}; line-height: 1.7; margin-bottom: 20px; }
    .reviews-carousel__author { font-family: ${fontBody}; font-size: 0.85rem; font-weight: 600; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.1em; }
    .reviews-carousel__dots { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
    .reviews-carousel__dot { width: 8px; height: 8px; border-radius: 50%; background: ${isLight ? 'rgba(45,36,40,0.15)' : 'rgba(255,255,255,0.15)'}; border: none; cursor: pointer; transition: background 0.3s, transform 0.3s; padding: 0; }
    .reviews-carousel__dot.active { background: ${accentColor}; transform: scale(1.3); }`;

      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + carouselCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added reviews carousel CSS');
      }
    }

    // 3. Replace the reviews rendering JS to use carousel instead of grid
    if (!html.includes('reviews-carousel')) {
      // Find existing reviews rendering and replace with carousel version
      const reviewsRenderStart = html.indexOf("document.getElementById('reviews-list').innerHTML");
      if (reviewsRenderStart > -1) {
        // Find the block end - look for the next catch or section comment
        const afterRender = html.substring(reviewsRenderStart);
        // Find testimonials display none block
        const testDisplayNone = afterRender.indexOf("testimonials').style.display = 'none'");
        if (testDisplayNone > -1) {
          // Find the closing of this block
          let endSearch = reviewsRenderStart + testDisplayNone;
          // Go to end of line/statement
          let braces = 0;
          for (let i = endSearch; i < Math.min(endSearch + 100, html.length); i++) {
            if (html[i] === '}') braces++;
            if (braces >= 2) { endSearch = i + 1; break; }
          }

          const carouselRenderCode = `// Carousel reviews
              var carouselContainer = document.getElementById('reviews-list');
              carouselContainer.className = 'reviews-carousel';
              carouselContainer.innerHTML = reviews.map(function(r, i) {
                var name = (r.user && r.user.name) || 'Client';
                var stars = '';
                for (var s = 0; s < r.rating; s++) stars += '★';
                return '<div class="reviews-carousel__slide' + (i === 0 ? ' active' : '') + '">' +
                  '<div class="reviews-carousel__stars">' + stars + '</div>' +
                  '<p class="reviews-carousel__text">"' + (r.comment || 'Great experience!') + '"</p>' +
                  '<p class="reviews-carousel__author">— ' + name + '</p>' +
                  '</div>';
              }).join('');
              // Add dots
              var dotsHtml = '<div class="reviews-carousel__dots">';
              for (var d = 0; d < Math.min(reviews.length, 20); d++) {
                dotsHtml += '<button class="reviews-carousel__dot' + (d === 0 ? ' active' : '') + '" data-slide="' + d + '"></button>';
              }
              dotsHtml += '</div>';
              carouselContainer.insertAdjacentHTML('afterend', dotsHtml);
              
              // Auto-rotate
              var currentSlide = 0;
              var slides = carouselContainer.querySelectorAll('.reviews-carousel__slide');
              var totalSlides = Math.min(slides.length, 20);
              var dots = carouselContainer.parentElement.querySelectorAll('.reviews-carousel__dot');
              
              function showSlide(idx) {
                slides.forEach(function(s, i) { s.classList.toggle('active', i === idx); });
                dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
                currentSlide = idx;
              }
              
              dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                  showSlide(parseInt(this.getAttribute('data-slide')));
                });
              });
              
              setInterval(function() {
                showSlide((currentSlide + 1) % totalSlides);
              }, 5000);
              
              carouselContainer.style.display = 'block';
              document.getElementById('reviews-loading').style.display = 'none';
            } else {
              document.getElementById('testimonials').style.display = 'none';
            }`;

          html = html.slice(0, reviewsRenderStart) + carouselRenderCode + html.slice(endSearch);
          changes.push('Replaced reviews grid with fading carousel');
        }
      }
    }

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

    return NextResponse.json({
      success: true,
      theme: isLight ? 'light' : 'dark',
      changes,
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
