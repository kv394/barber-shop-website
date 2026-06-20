import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-shop
 * Generic fix endpoint: sets template to 'custom' and adds missing nav links + review form
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
      select: { customization: true, name: true, template: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';
    const changes: string[] = [];

    if (!html) {
      return NextResponse.json({ error: 'No customHtml found' }, { status: 400 });
    }

    // 1. Fix template to 'custom' if it has customHtml
    if (shop.template !== 'custom') {
      await prisma.shop.update({
        where: { id: shopId },
        data: { template: 'custom' }
      });
      changes.push(`Changed template from '${shop.template}' to 'custom'`);
    }

    // 2. Detect nav structure and add Products/Reviews links if missing
    if (!html.includes('href="#products"')) {
      // Find the last nav link before CTA button - try common patterns
      const navPatterns = [
        { find: '<li><a href="#gallery">Gallery</a></li>', label: 'Gallery' },
        { find: '<li><a href="#contact">Contact</a></li>', label: 'Contact' },
        { find: '<li><a href="#experience">Experience</a></li>', label: 'Experience' },
      ];
      
      for (const p of navPatterns) {
        if (html.includes(p.find)) {
          html = html.replace(
            p.find,
            `${p.find}
        <li><a href="#products">Products</a></li>`
          );
          changes.push(`Added Products nav link after ${p.label}`);
          break;
        }
      }
    }

    // Find the reviews/testimonials section ID and add nav link
    const reviewsSectionId = html.includes('id="testimonials"') ? 'testimonials' : 
                              html.includes('id="reviews"') ? 'reviews' : null;
    if (reviewsSectionId && !html.includes(`href="#${reviewsSectionId}"`)) {
      if (html.includes('href="#products"')) {
        html = html.replace(
          '<li><a href="#products">Products</a></li>',
          `<li><a href="#products">Products</a></li>
        <li><a href="#${reviewsSectionId}">Reviews</a></li>`
        );
        changes.push('Added Reviews nav link');
      }
    }

    // 3. Add review form if missing
    if (!html.includes('review-form')) {
      // Detect theme colors from CSS variables
      const primaryColorMatch = html.match(/--primary[^:]*:\s*([^;]+);/) || 
                                 html.match(/--accent[^:]*:\s*([^;]+);/) ||
                                 html.match(/--gold-primary:\s*([^;]+);/);
      const primaryColor = primaryColorMatch ? primaryColorMatch[1].trim() : '#e9c176';
      
      const bgDarkMatch = html.match(/--bg-dark(?:est)?:\s*([^;]+);/) ||
                           html.match(/--bg-main:\s*([^;]+);/);
      const bgDark = bgDarkMatch ? bgDarkMatch[1].trim() : '#0e0e0e';
      
      const bgCardMatch = html.match(/--bg-card:\s*([^;]+);/) ||
                           html.match(/--bg-section:\s*([^;]+);/);
      const bgCard = bgCardMatch ? bgCardMatch[1].trim() : '#252525';

      const fontSerifMatch = html.match(/--font-serif:\s*([^;]+);/);
      const fontSerif = fontSerifMatch ? 'var(--font-serif)' : 'Georgia, serif';
      
      const fontSansMatch = html.match(/--font-sans:\s*([^;]+);/);
      const fontSans = fontSansMatch ? 'var(--font-sans)' : 'sans-serif';

      // Add review form CSS
      const reviewCss = `
    /* Review Form */
    .review-form-section { padding: 100px 0; background: ${bgDark}; }
    .review-form { max-width: 600px; margin: 0 auto; padding: 48px; background: ${bgCard}; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
    .review-form h3 { font-family: ${fontSerif}; font-size: clamp(1.4rem, 2.5vw, 1.8rem); font-weight: 700; color: #fff; margin-bottom: 8px; text-align: center; }
    .review-form__subtitle { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-bottom: 24px; }
    .review-form__stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .review-form__star { font-size: 2.2rem; cursor: pointer; color: rgba(255,255,255,0.15); transition: color 0.2s, transform 0.2s; user-select: none; }
    .review-form__star:hover, .review-form__star.active { color: ${primaryColor}; transform: scale(1.15); }
    .review-form textarea { width: 100%; min-height: 120px; padding: 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-family: ${fontSans}; font-size: 0.95rem; resize: vertical; transition: border-color 0.3s; }
    .review-form textarea:focus { outline: none; border-color: ${primaryColor}; }
    .review-form textarea::placeholder { color: rgba(255,255,255,0.3); }
    .review-form__submit { display: block; width: 100%; margin-top: 20px; padding: 16px; background: ${primaryColor}; color: #000; font-family: ${fontSans}; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
    .review-form__submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${primaryColor}40; }
    .review-form__submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .review-form__msg { text-align: center; margin-top: 14px; font-size: 0.9rem; }
    .review-form__msg--success { color: #4ade80; }
    .review-form__msg--error { color: #f87171; }`;

      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + reviewCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added review form CSS (theme-detected)');
      }

      // Add review form HTML after testimonials/reviews section
      const reviewFormHtml = `
  <div class="review-form-section">
    <div class="container">
      <div class="review-form" id="review-form">
        <h3>Share Your Experience</h3>
        <p class="review-form__subtitle">We value your feedback</p>
        <div class="review-form__stars" id="review-stars">
          <span class="review-form__star" data-rating="1">&#9733;</span>
          <span class="review-form__star" data-rating="2">&#9733;</span>
          <span class="review-form__star" data-rating="3">&#9733;</span>
          <span class="review-form__star" data-rating="4">&#9733;</span>
          <span class="review-form__star" data-rating="5">&#9733;</span>
        </div>
        <textarea id="review-comment" placeholder="Tell us about your experience (optional)..." maxlength="2000"></textarea>
        <button class="review-form__submit" id="review-submit" disabled>Submit Review</button>
        <div class="review-form__msg" id="review-msg"></div>
      </div>
    </div>
  </div>`;

      // Insert after the reviews/testimonials section
      if (reviewsSectionId) {
        const sectionStart = html.indexOf(`id="${reviewsSectionId}"`);
        if (sectionStart > -1) {
          const sectionClose = html.indexOf('</section>', sectionStart);
          if (sectionClose > -1) {
            const insertPos = sectionClose + '</section>'.length;
            html = html.slice(0, insertPos) + reviewFormHtml + html.slice(insertPos);
            changes.push('Added review form HTML after reviews section');
          }
        }
      }

      // Add review form script
      const reviewScript = `

          // ---- Review Form ----
          (function() {
            var selectedRating = 0;
            var stars = document.querySelectorAll('.review-form__star');
            var submitBtn = document.getElementById('review-submit');
            var commentEl = document.getElementById('review-comment');
            var msgEl = document.getElementById('review-msg');
            if (!stars.length || !submitBtn) return;
            stars.forEach(function(star) {
              star.addEventListener('click', function() {
                selectedRating = parseInt(this.getAttribute('data-rating'));
                stars.forEach(function(s) {
                  s.classList.toggle('active', parseInt(s.getAttribute('data-rating')) <= selectedRating);
                });
                submitBtn.disabled = false;
              });
              star.addEventListener('mouseenter', function() {
                var hoverRating = parseInt(this.getAttribute('data-rating'));
                stars.forEach(function(s) {
                  s.style.color = parseInt(s.getAttribute('data-rating')) <= hoverRating ? '${primaryColor}' : '';
                });
              });
            });
            document.getElementById('review-stars').addEventListener('mouseleave', function() {
              stars.forEach(function(s) { s.style.color = ''; });
            });
            submitBtn.addEventListener('click', function() {
              if (!selectedRating) return;
              submitBtn.disabled = true;
              submitBtn.textContent = 'Submitting...';
              msgEl.textContent = '';
              msgEl.className = 'review-form__msg';
              KutzApp.submitReview({
                rating: selectedRating,
                comment: commentEl.value.trim() || null
              }).then(function() {
                msgEl.textContent = 'Thank you for your review!';
                msgEl.className = 'review-form__msg review-form__msg--success';
                submitBtn.textContent = 'Review Submitted!';
                commentEl.value = '';
                selectedRating = 0;
                stars.forEach(function(s) { s.classList.remove('active'); });
                setTimeout(function() { submitBtn.textContent = 'Submit Review'; msgEl.textContent = ''; }, 5000);
              }).catch(function(err) {
                msgEl.textContent = err.message || 'Failed to submit. Please try again.';
                msgEl.className = 'review-form__msg review-form__msg--error';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
              });
            });
          })();`;

      const lastScript = html.lastIndexOf('</script>');
      if (lastScript > -1) {
        html = html.slice(0, lastScript) + reviewScript + '\n' + html.slice(lastScript);
        changes.push('Added review form script');
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed', html_length: html.length });
    }

    // Save HTML changes
    await prisma.shop.update({
      where: { id: shopId },
      data: {
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

    return NextResponse.json({ success: true, changes, html_length: html.length });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
