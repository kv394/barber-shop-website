import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/add-products-script
 * 
 * Adds the products rendering script AND review form to the custom HTML.
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

    // 1. Add products rendering script if missing
    if (!html.includes('getSellableProducts')) {
      const reviewsCallPattern = "KutzApp.getReviews()";
      const reviewsIdx = html.indexOf(reviewsCallPattern);
      
      if (reviewsIdx > -1) {
        const searchAfter = html.substring(reviewsIdx);
        const endMarker = "testimonials').style.display = 'none'";
        const endIdx = searchAfter.indexOf(endMarker);
        
        if (endIdx > -1) {
          let pos = reviewsIdx + endIdx + endMarker.length;
          let braceCount = 0;
          let foundEnd = pos;
          for (let i = pos; i < Math.min(pos + 200, html.length); i++) {
            if (html[i] === '}') braceCount++;
            if (html[i] === ';' && braceCount >= 2) {
              foundEnd = i + 1;
              break;
            }
          }

          const productsScript = `

          // ---- Products ----
          KutzApp.getSellableProducts().then(function(products) {
            var listEl = document.getElementById('products-list');
            var loadEl = document.getElementById('products-loading');
            if (!listEl || !loadEl) return;
            if (!products || products.length === 0) {
              loadEl.textContent = 'No products available at this time.';
              return;
            }
            listEl.innerHTML = products.map(function(p) {
              var imgSrc = p.imageUrl || '';
              var imgHtml = imgSrc ? '<div class="service-card__image-wrapper"><img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy"></div>' : '';
              return '<div class="service-card reveal">' +
                imgHtml +
                '<div class="service-card__body">' +
                '<h3 class="service-card__name">' + (p.name || 'Product') + '</h3>' +
                '<p class="service-card__desc">' + (p.description || '') + '</p>' +
                (p.price && parseFloat(p.price) > 0 ? '<p class="service-card__price">$' + parseFloat(p.price).toFixed(2) + '</p>' : '') +
                '</div></div>';
            }).join('');
            loadEl.style.display = 'none';
            listEl.style.display = 'grid';
            if (typeof observer !== 'undefined') {
              listEl.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
            }
          }).catch(function(err) { console.warn('Products error:', err); });`;

          html = html.slice(0, foundEnd) + productsScript + html.slice(foundEnd);
          changes.push('Added products rendering script');
        }
      }
    }

    // 2. Add review submission form if missing
    if (!html.includes('review-form')) {
      // Add review form CSS
      const reviewFormCss = `
    /* Review Form */
    .review-form-section { padding: 40px 0 0; }
    .review-form { max-width: 600px; margin: 0 auto; padding: 32px; background: var(--bg-card, #252525); border-radius: 12px; border: 1px solid rgba(233,193,118,0.15); }
    .review-form h3 { font-family: var(--font-serif, Georgia, serif); font-size: 1.4rem; color: var(--gold-primary, #e9c176); margin-bottom: 20px; text-align: center; }
    .review-form__stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
    .review-form__star { font-size: 2rem; cursor: pointer; color: #555; transition: color 0.2s, transform 0.2s; user-select: none; }
    .review-form__star:hover, .review-form__star.active { color: var(--gold-primary, #e9c176); transform: scale(1.15); }
    .review-form textarea { width: 100%; min-height: 100px; padding: 14px; background: var(--bg-main, #131313); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-primary, #f5f5f5); font-family: var(--font-sans, sans-serif); font-size: 0.95rem; resize: vertical; }
    .review-form textarea::placeholder { color: var(--text-muted, #777); }
    .review-form__submit { display: block; width: 100%; margin-top: 16px; padding: 14px; background: var(--gold-gradient, linear-gradient(135deg,#e9c176,#d4a855)); color: var(--bg-darkest, #0e0e0e); font-family: var(--font-sans, sans-serif); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }
    .review-form__submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(233,193,118,0.25); }
    .review-form__submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .review-form__msg { text-align: center; margin-top: 12px; font-size: 0.9rem; }
    .review-form__msg--success { color: #4ade80; }
    .review-form__msg--error { color: #f87171; }
`;
      // Insert CSS before closing </style>
      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        html = html.slice(0, lastStyleClose) + reviewFormCss + html.slice(lastStyleClose);
        changes.push('Added review form CSS');
      }

      // Add review form HTML after the reviews section
      const reviewFormHtml = `
  <!-- Review Submission Form -->
  <div class="review-form-section">
    <div class="container">
      <div class="review-form reveal" id="review-form">
        <h3>Share Your Experience</h3>
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
  </div>
`;
      // Insert after testimonials section closing tag
      const testimonialsClose = html.indexOf('</section>', html.indexOf('id="testimonials"'));
      if (testimonialsClose > -1) {
        const insertPos = html.indexOf('>', testimonialsClose) + 1;
        html = html.slice(0, insertPos) + reviewFormHtml + html.slice(insertPos);
        changes.push('Added review submission form HTML');
      }

      // Add review form script
      const reviewFormScript = `

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
                  s.style.color = parseInt(s.getAttribute('data-rating')) <= hoverRating ? 'var(--gold-primary, #e9c176)' : '#555';
                });
              });
            });

            document.getElementById('review-stars').addEventListener('mouseleave', function() {
              stars.forEach(function(s) {
                s.style.color = '';
              });
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
                setTimeout(function() {
                  submitBtn.textContent = 'Submit Review';
                  msgEl.textContent = '';
                  msgEl.className = 'review-form__msg';
                }, 5000);
              }).catch(function(err) {
                msgEl.textContent = err.message || 'Failed to submit review. Please try again.';
                msgEl.className = 'review-form__msg review-form__msg--error';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
              });
            });
          })();`;

      // Insert script in the SDK data loading section
      if (html.includes('getSellableProducts')) {
        const productsEnd = html.indexOf("}).catch(function(err) { console.warn('Products error:', err); });");
        if (productsEnd > -1) {
          const insertPoint = productsEnd + "}).catch(function(err) { console.warn('Products error:', err); });".length;
          html = html.slice(0, insertPoint) + reviewFormScript + html.slice(insertPoint);
          changes.push('Added review form script');
        }
      } else {
        // Fallback: add before closing </script>
        const lastScript = html.lastIndexOf('</script>');
        if (lastScript > -1) {
          html = html.slice(0, lastScript) + reviewFormScript + '\n' + html.slice(lastScript);
          changes.push('Added review form script (fallback)');
        }
      }
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

    // Invalidate caches
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
